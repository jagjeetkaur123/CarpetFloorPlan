import sys
try:
    from pypdf import PdfReader
except Exception:
    from PyPDF2 import PdfReader

if len(sys.argv) >= 2:
    p = sys.argv[1]
else:
    p = r'c:\Users\Toni\Desktop\Jag1910\CarpetFloorPlan\Floor Plan & Carpet Calculator 5.pdf'

try:
    r = PdfReader(p)
    for i, page in enumerate(r.pages):
        t = page.extract_text() or ''
        print(f'--- PAGE {i+1} ---')
        print(t[:8000])
        print()
except Exception as e:
    print('ERR', type(e).__name__, e)
