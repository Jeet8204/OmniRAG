from fastapi import APIRouter, HTTPException, Depends # type: ignore
from fastapi.responses import StreamingResponse # type: ignore
from pydantic import BaseModel

import google.generativeai as genai # type: ignore
import httpx
import json
import os
import asyncio
import logging

from auth import get_current_user_id

router = APIRouter()

logger = logging.getLogger(__name__)

GMAIL_API = "https://gmail.googleapis.com/gmail/v1"


class GmailChatRequest(BaseModel):
    message: str
    access_token: str


async def fetch_emails(access_token: str, max_results: int = 15) -> list[str]:
    headers = {
        "Authorization": f"Bearer {access_token}"
    }

    async with httpx.AsyncClient(timeout=20) as client:
        search = await client.get(
            f"{GMAIL_API}/users/me/messages",
            headers=headers,
            params={
                "q": "in:inbox",
                "maxResults": max_results
            },
        )

        if search.status_code == 401:
            raise HTTPException(
                status_code=401,
                detail="Gmail token expired. Please reconnect."
            )

        if search.status_code == 429:
            raise HTTPException(
                status_code=429,
                detail="Gmail API quota exceeded. Try again shortly."
            )

        if not search.is_success:
            logger.error(f"Gmail search failed: {search.status_code} {search.text}")
            raise HTTPException(
                status_code=502,
                detail="Failed to search Gmail."
            )

        messages = search.json().get("messages", [])

        if not messages:
            return []

        emails = []

        for msg in messages:
            await asyncio.sleep(0.2)

            detail = await client.get(
                f"{GMAIL_API}/users/me/messages/{msg['id']}",
                headers=headers,
                params={
                    "format": "metadata",
                    "metadataHeaders": ["Subject", "From", "Date"],
                },
            )

            if not detail.is_success:
                logger.warning(f"Skipping Gmail message {msg['id']}: {detail.status_code}")
                continue

            data = detail.json()
            hdrs = data.get("payload", {}).get("headers", [])

            subject = next(
                (h["value"] for h in hdrs if h["name"].lower() == "subject"),
                "No subject"
            )

            sender = next(
                (h["value"] for h in hdrs if h["name"].lower() == "from"),
                "Unknown"
            )

            date = next(
                (h["value"] for h in hdrs if h["name"].lower() == "date"),
                ""
            )

            snippet = data.get("snippet", "")

            emails.append(
                f"From: {sender}\n"
                f"Date: {date}\n"
                f"Subject: {subject}\n"
                f"Preview: {snippet}"
            )

    return emails


@router.post("/api/gmail-chat")
async def gmail_chat(
    body: GmailChatRequest,
    uid: str = Depends(get_current_user_id),
):
    try:
        emails = await fetch_emails(body.access_token)

    except HTTPException as e:
        async def error_stream():
            if e.status_code == 401:
                msg = "Gmail token expired — please reconnect Gmail."
            elif e.status_code == 429:
                msg = "Gmail API quota exceeded. Wait a moment and try again."
            else:
                msg = "Could not read Gmail right now. Please try again."

            yield f"data: {json.dumps({'type': 'token', 'data': msg})}\n\n"
            yield "data: [DONE]\n\n"

        return StreamingResponse(
            error_stream(),
            media_type="text/event-stream"
        )

    if not emails:
        context = "No emails found in the inbox."
    else:
        context = "\n\n---\n\n".join(emails)

    prompt = f"""You are an AI assistant that helps users understand their Gmail inbox.

Recent emails:

{context}

User question: {body.message}

Answer clearly and concisely based only on the emails above. If the emails do not contain enough information to answer the question, say so."""

    api_key = os.environ.get("GOOGLE_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="GOOGLE_API_KEY is missing."
        )

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-2.5-flash")

    async def stream():
        try:
            response = model.generate_content(prompt, stream=True)

            for chunk in response:
                if chunk.text:
                    yield f"data: {json.dumps({'type': 'token', 'data': chunk.text})}\n\n"

            yield "data: [DONE]\n\n"

        except Exception as e:
            err = str(e)

            msg = (
                "Gemini quota exceeded. Try again in a moment."
                if "429" in err or "quota" in err.lower()
                else f"Error: {err}"
            )

            yield f"data: {json.dumps({'type': 'token', 'data': msg})}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        stream(),
        media_type="text/event-stream"
    )