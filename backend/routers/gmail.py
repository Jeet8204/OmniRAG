from fastapi import APIRouter, HTTPException # type: ignore
from fastapi.responses import StreamingResponse # type: ignore
from pydantic import BaseModel
import google.generativeai as genai # type: ignore
import httpx
import json
import os
import asyncio

router = APIRouter()

GMAIL_API = "https://gmail.googleapis.com/gmail/v1"


class GmailChatRequest(BaseModel):
    message: str
    access_token: str


async def fetch_emails(access_token: str, max_results: int = 15) -> list[str]:
    headers = {"Authorization": f"Bearer {access_token}"}

    async with httpx.AsyncClient(timeout=15) as client:

        # pull recent inbox mail, no keyword query 
        search = await client.get(
            f"{GMAIL_API}/users/me/messages",
            headers=headers,
            params={"q": "in:inbox", "maxResults": max_results},
        )

        if search.status_code == 401:
            raise HTTPException(status_code=401, detail="Gmail token expired. Please reconnect.")
        if search.status_code == 429:
            raise HTTPException(status_code=429, detail="Gmail API quota exceeded. Try again shortly.")
        if not search.is_success:
            raise HTTPException(status_code=502, detail="Failed to search Gmail.")

        messages = search.json().get("messages", [])
        if not messages:
            return []

        # fetch details with small delay between calls
        emails = []
        for msg in messages:
            await asyncio.sleep(0.2)       # 200ms gap between calls

            detail = await client.get(
                f"{GMAIL_API}/users/me/messages/{msg['id']}",
                headers=headers,
                params={
                    "format": "metadata",
                    "metadataHeaders": ["Subject", "From", "Date"],
                },
            )
            if not detail.is_success:
                continue

            data = detail.json()
            hdrs = data.get("payload", {}).get("headers", [])
            subject = next((h["value"] for h in hdrs if h["name"] == "Subject"), "No subject")
            sender  = next((h["value"] for h in hdrs if h["name"] == "From"), "Unknown")
            date    = next((h["value"] for h in hdrs if h["name"] == "Date"), "")
            snippet = data.get("snippet", "")

            emails.append(
                f"From: {sender}\nDate: {date}\nSubject: {subject}\nPreview: {snippet}"
            )

    return emails


@router.post("/api/gmail-chat")
async def gmail_chat(body: GmailChatRequest):
    try:
        emails = await fetch_emails(body.access_token)
    except HTTPException as e:
        # surface quota/auth errors as streamed messages instead of hard errors
        async def error_stream():
            msg = (
                "Gmail token expired — please reconnect."
                if e.status_code == 401
                else "Gmail API quota exceeded. Wait a moment and try again."
            )
            yield f"data: {json.dumps({'type': 'token', 'data': msg})}\n\n"
            yield "data: [DONE]\n\n"
        return StreamingResponse(error_stream(), media_type="text/event-stream")

    if not emails:
        context = "No emails found in the inbox."
    else:
        context = "\n\n---\n\n".join(emails)

    prompt = f"""You are an AI assistant that helps users understand their Gmail inbox.

Recent emails:

{context}

User question: {body.message}

Answer clearly and concisely based only on the emails above. If the emails don't contain enough information to answer the question, say so."""

    api_key = os.environ.get("GOOGLE_API_KEY")
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

    return StreamingResponse(stream(), media_type="text/event-stream")