"""Report optional quality-tool capabilities without installing anything."""
import importlib.util
import shutil

def available():
    return {"images": importlib.util.find_spec("PIL") is not None,
            "numerical_analysis": importlib.util.find_spec("numpy") is not None,
            "video_decode": shutil.which("ffmpeg") is not None,
            "video_metadata": shutil.which("ffprobe") is not None}
