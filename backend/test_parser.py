from services.pdf_parser import parse_resume

text = parse_resume("uploads/Resume_v.pdf")
print("--- Extracted Text ---")
print(text[:500])
print(f"\nTotal characters: {len(text)}")
