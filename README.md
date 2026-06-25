
Run Frontend
------------
cd frontend
npm run dev


Run Backend
-------------
cd backend
venv\Scripts\Activate
docker-compose up -d
uvicorn main:app --reload

if you have created Zip:->
---------------------------------- 
deactivate
Remove-Item -Recurse -Force venv
python -m venv venv
.\venv\Scripts\Activate
pip install -r requirements.txt


NPM Commands
--------------
npm install react-markdown
npm install tailwindcss @tailwindcss/postcss postcss
npm install react-markdown react-syntax-highlighter
npm install -D @types/react-syntax-highlighter


Frontend -> Install Firebase 
-----------------------------
npm install firebase

Backend -> FireBase - Admin
------------------------
pip install firebase-admin --break-system-packages


Delete from Qdrant Database
----------------------------
Invoke-RestMethod -Uri "http://localhost:6333/collections/knowledge_base" -Method DELETE