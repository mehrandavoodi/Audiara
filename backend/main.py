from fastapi import FastAPI, File, UploadFile, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import os
from spleeter.separator import Separator
import librosa
import uuid
from typing import Dict
from concurrent.futures import ThreadPoolExecutor

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
STEM_DIR = os.path.join(UPLOAD_DIR, "stems")
os.makedirs(STEM_DIR, exist_ok=True)
app.mount("/files", StaticFiles(directory=UPLOAD_DIR), name="files")


job_status: Dict[str, Dict] = {}  # jobid -> status/result

executor = ThreadPoolExecutor(max_workers=2)

def analyze_audio(file_location, file_name, jobid):
    try:
        job_status[jobid]['status'] = 'analyzing'
        # 1. Separate stems
        separator = Separator('spleeter:5stems')
        separator.separate_to_file(file_location, STEM_DIR, codec='wav')
        basename = os.path.splitext(file_name)[0]
        stem_folder = os.path.join(STEM_DIR, basename)
        expected_labels = ["vocals", "drums", "bass", "piano", "other"]
        stems = []
        for label in expected_labels:
            filename = f"{label}.wav"
            path = os.path.join(stem_folder, filename)
            if os.path.exists(path):
                stems.append({
                    "label": label,
                    "url": f"/files/stems/{basename}/{filename}"
                })
        # 2. Onset detection (hits)
        y, sr = librosa.load(file_location, sr=None)
        onset_times = librosa.onset.onset_detect(y=y, sr=sr, units='time')
        hits = onset_times.tolist()
        duration = librosa.get_duration(y=y, sr=sr)
        # 3. Mark job as done, save result
        job_status[jobid] = {
            'status': 'done',
            'result': {
                "original": { "label": "original", "url": f"/files/{file_name}" },
                "stems": stems,
                "hits": hits,
                "duration": duration
            }
        }
    except Exception as e:
        job_status[jobid] = { "status": "error", "error": str(e) }

@app.post("/upload-audio/")
async def upload_audio(file: UploadFile = File(...)):
    jobid = str(uuid.uuid4())
    job_status[jobid] = {"status": "uploading"}
    file_location = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_location, "wb") as f:
        f.write(await file.read())
    job_status[jobid]['status'] = 'queued'
    # Kick off background processing
    executor.submit(analyze_audio, file_location, file.filename, jobid)
    return {"jobid": jobid}

@app.get("/status/{jobid}")
def get_status(jobid: str):
    status = job_status.get(jobid)
    if not status:
        return JSONResponse({"status": "not_found"}, status_code=404)
    return status
