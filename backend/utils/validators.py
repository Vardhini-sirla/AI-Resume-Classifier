ALLOWED_EXTENSIONS = {"pdf", "docx", "doc"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


def validate_file(filename: str, file_size: int) -> list[str]:
    """Return a list of validation error messages (empty = valid)."""
    errors = []
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        errors.append("Only PDF and DOCX files are allowed")
    if file_size > MAX_FILE_SIZE:
        errors.append("File size must be under 5 MB")
    return errors
