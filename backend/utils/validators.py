import os

ALLOWED_EXTENSIONS = {'pdf'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

def validate_file(filename, file_size):
    errors = []
    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    if ext not in ALLOWED_EXTENSIONS:
        errors.append('Only PDF files are allowed')
    if file_size > MAX_FILE_SIZE:
        errors.append('File size must be under 5MB')
    return errors
