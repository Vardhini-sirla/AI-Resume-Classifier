import PyPDF2
import pdfplumber

def extract_text_pypdf2(file_path):
    """Basic PDF text extraction - fast but misses complex layouts"""
    text = ''
    try:
        with open(file_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            for page in reader.pages:
                text += page.extract_text() or ''
    except Exception as e:
        print(f"PyPDF2 error: {e}")
    return text.strip()

def extract_text_pdfplumber(file_path):
    """Advanced extraction - better with tables and columns"""
    text = ''
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text += page.extract_text() or ''
    except Exception as e:
        print(f"pdfplumber error: {e}")
    return text.strip()

def parse_resume(file_path):
    """Try pdfplumber first (better quality), fall back to PyPDF2"""
    text = extract_text_pdfplumber(file_path)
    if not text or len(text) < 50:
        text = extract_text_pypdf2(file_path)
    return text