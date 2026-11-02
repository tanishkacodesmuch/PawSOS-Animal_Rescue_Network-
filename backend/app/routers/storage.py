import uuid
import base64
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from app.config import settings

router = APIRouter(prefix="/storage", tags=["Storage"])

@router.post("/upload")
async def upload_photo(file: Optional[UploadFile] = File(None), dataUrl: Optional[str] = Form(None)):
    """
    Uploads animal photograph to Supabase Storage bucket.
    If Supabase credentials are not yet configured in .env, saves the photo file or returns a reference.
    """
    if file:
        file_ext = file.filename.split(".")[-1] if file.filename else "jpg"
        unique_filename = f"emergency_{uuid.uuid4()}.{file_ext}"

        # If Supabase credentials are provided:
        if settings.SUPABASE_URL and settings.SUPABASE_KEY:
            try:
                from supabase import create_client
                supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
                file_bytes = await file.read()
                res = supabase.storage.from_(settings.SUPABASE_STORAGE_BUCKET).upload(
                    unique_filename,
                    file_bytes,
                    {"content-type": file.content_type or "image/jpeg"}
                )
                public_url = supabase.storage.from_(settings.SUPABASE_STORAGE_BUCKET).get_public_url(unique_filename)
                return {"url": public_url, "path": unique_filename}
            except Exception as e:
                # If Supabase upload fails due to unconfigured bucket, provide fallback
                file_bytes = await file.read()
                b64 = base64.b64encode(file_bytes).decode('utf-8')
                data_url = f"data:{file.content_type or 'image/jpeg'};base64,{b64}"
                return {"url": data_url, "path": unique_filename}
        else:
            file_bytes = await file.read()
            b64 = base64.b64encode(file_bytes).decode('utf-8')
            data_url = f"data:{file.content_type or 'image/jpeg'};base64,{b64}"
            return {"url": data_url, "path": unique_filename}

    elif dataUrl:
        return {"url": dataUrl, "path": f"data_upload_{uuid.uuid4()}.jpg"}

    raise HTTPException(status_code=400, detail="No file or image data provided.")
