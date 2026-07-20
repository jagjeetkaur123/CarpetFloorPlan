import os
from pypdf import PdfReader
pdf = r'C:\Users\Toni\Downloads\Floor Plan & Carpet Calculator 4.pdf'
reader = PdfReader(pdf)
for i, p in enumerate(reader.pages[:3]):
    txt = p.extract_text() or ''
    print('--- PAGE', i+1, '---')
    print(txt[:6000])
    print()
