import os
import json
import re
from PyPDF2 import PdfReader
from pdf2image import convert_from_path
import base64

def extract_title(page_text):
    """Extract title by finding the largest font size text"""
    lines = page_text.split('\n')
    # First non-empty line is typically the title
    for line in lines:
        line = line.strip()
        if line and len(line) > 10:
            return line
    return "Unknown Title"

def extract_authors(page_text):
    """Extract authors - look for text with superscripts"""
    # Pattern: Lastname, Firstname¹
    author_pattern = r'([A-Z][a-z]+,\s+[A-Z][a-z]+[¹²³⁴⁵⁶⁷⁸⁹⁰]+)'
    authors = re.findall(author_pattern, page_text)
    
    if authors:
        return ', '.join([a.replace('¹', '').replace('²', '').replace('³', '') for a in authors])
    
    # Fallback: look for author-like patterns
    lines = page_text.split('\n')
    for i, line in enumerate(lines):
        if 'abstract' in line.lower() and i > 0:
            return lines[i-1].strip()
    
    return "Unknown Author"

def extract_abstract(page_text):
    """Extract abstract between 'Abstract' and 'Introduction'"""
    text_lower = page_text.lower()
    
    # Find abstract start
    abstract_start = text_lower.find('abstract')
    if abstract_start == -1:
        return "Abstract not found"
    
    # Find introduction (end marker)
    intro_start = text_lower.find('introduction', abstract_start)
    
    if intro_start != -1:
        abstract_text = page_text[abstract_start:intro_start]
    else:
        # No introduction found, take rest of page
        abstract_text = page_text[abstract_start:]
    
    # Clean up
    abstract_text = abstract_text.replace('Abstract', '').replace('ABSTRACT', '')
    abstract_text = re.sub(r'Figure \d+.*?(?=\n)', '', abstract_text)
    abstract_text = ' '.join(abstract_text.split())
    
    return abstract_text.strip()[:500]  # Limit length

def create_apa_citation(title, authors, year, repo_url):
    """Generate APA citation"""
    author_list = authors.split(',')
    if len(author_list) > 1:
        authors_formatted = f"{author_list[0].strip()}, & {author_list[1].strip()}"
    else:
        authors_formatted = authors.strip()
    
    return f"{authors_formatted} ({year}). {title}. Retrieved from {repo_url}"

def pdf_first_page_to_image(pdf_path):
    """Convert first page to base64 image"""
    try:
        images = convert_from_path(pdf_path, first_page=1, last_page=1, dpi=150)
        if images:
            img_path = pdf_path.replace('.pdf', '_preview.png')
            images[0].save(img_path, 'PNG')
            return img_path
    except Exception as e:
        print(f"Error converting PDF to image: {e}")
    return None

def process_papers():
    """Main processing function"""
    papers_dir = 'papers'
    output_file = 'papers-data.json'
    papers_data = []
    
    if not os.path.exists(papers_dir):
        os.makedirs(papers_dir)
        print(f"Created {papers_dir} directory")
        return
    
    pdf_files = [f for f in os.listdir(papers_dir) if f.endswith('.pdf')]
    
    if not pdf_files:
        print("No PDF files found in papers directory")
        return
    
    for idx, pdf_file in enumerate(pdf_files, 1):
        pdf_path = os.path.join(papers_dir, pdf_file)
        
        try:
            print(f"Processing: {pdf_file}")
            
            # Read first page
            reader = PdfReader(pdf_path)
            first_page = reader.pages[0]
            page_text = first_page.extract_text()
            
            # Extract information
            title = extract_title(page_text)
            authors = extract_authors(page_text)
            abstract = extract_abstract(page_text)
            
            # Generate preview image
            preview_img = pdf_first_page_to_image(pdf_path)
            
            # Create paper entry
            paper = {
                'id': str(idx),
                'title': title,
                'authors': authors,
                'abstract': abstract,
                'citation': create_apa_citation(
                    title, 
                    authors, 
                    '2024',
                    f'https://github.com/algorembrant/papers/blob/main/{pdf_file}'
                ),
                'pdfUrl': f'./papers/{pdf_file}',
                'previewImage': f'./papers/{pdf_file.replace(".pdf", "_preview.png")}' if preview_img else None,
                'views': 0,
                'downloads': 0
            }
            
            papers_data.append(paper)
            print(f"✓ Processed: {title[:50]}...")
            
        except Exception as e:
            print(f"✗ Error processing {pdf_file}: {e}")
    
    # Save to JSON
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(papers_data, f, indent=2, ensure_ascii=False)
    
    print(f"\n✓ Successfully processed {len(papers_data)} papers")
    print(f"✓ Data saved to {output_file}")

if __name__ == '__main__':
    process_papers()