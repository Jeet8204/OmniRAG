useful commands

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

if not creating the virtual env :->
---------------------------------- 
deactivate
Remove-Item -Recurse -Force venv
python -m venv venv
.\venv\Scripts\Activate
pip install -r requirements.txt
