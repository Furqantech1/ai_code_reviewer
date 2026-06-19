from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import os
import io
import html
import httpx
from typing import Dict
from datetime import datetime
import markdown
from xhtml2pdf import pisa

from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Pydantic models for request/response
class CodeAnalysisRequest(BaseModel):
    code: str
    language: str

class CodeAnalysisResponse(BaseModel):
    review: str
    docstring: str
    language: str

class PDFExportRequest(BaseModel):
    code: str
    language: str
    review: str
    docstring: str

# Initialize FastAPI app
app = FastAPI(title="AI Code Review & Documentation Tool")

# CORS configuration for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173","https://ai-code-reviewer-taupe.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gemini API configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    GEMINI_API_KEY = os.getenv("OPENROUTER_API_KEY")  # Fallback to key stored under OPENROUTER_API_KEY variable

MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"

print(f"[OK] Gemini API Key loaded: {'Yes' if GEMINI_API_KEY else 'No'}")
print(f"[OK] Model: {MODEL}")

# Helper function to call Gemini API
async def call_gemini(prompt: str) -> str:
    """Call Gemini API with proper error handling"""
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API key not configured")
    
    try:
        url = f"{BASE_URL}/{MODEL}:generateContent?key={GEMINI_API_KEY}"
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                url,
                headers={
                    "Content-Type": "application/json"
                },
                json={
                    "contents": [
                        {
                            "parts": [
                                {
                                    "text": prompt
                                }
                            ]
                        }
                    ],
                    "generationConfig": {
                        "temperature": 0.3,
                        "maxOutputTokens": 4096
                    }
                }
            )
            
            # Log the status code for debugging
            print(f"API Response Status: {response.status_code}")
            
            # Check if request was successful
            if response.status_code != 200:
                error_text = response.text
                print(f"API Error Response: {error_text}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Gemini API error: {error_text}"
                )
            
            # Parse response JSON
            response_data = response.json()
            
            # Handle error response format if any
            if 'error' in response_data:
                error_msg = response_data['error'].get('message', 'Unknown error')
                raise HTTPException(status_code=500, detail=f"API Error: {error_msg}")
                
            # Check if 'candidates' exists in response
            if 'candidates' not in response_data:
                print(f"Full API Response: {response_data}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Unexpected API response format: {response_data}"
                )
            
            candidates = response_data['candidates']
            if not candidates or len(candidates) == 0:
                raise HTTPException(status_code=500, detail="API returned empty candidates")
                
            candidate = candidates[0]
            content = candidate.get('content', {})
            parts = content.get('parts', [])
            if not parts or len(parts) == 0:
                finish_reason = candidate.get('finishReason')
                raise HTTPException(
                    status_code=500,
                    detail=f"API returned empty content. Finish reason: {finish_reason}"
                )
                
            return parts[0].get('text', '')
            
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="Request timeout - AI model took too long to respond"
        )
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Network error: {str(e)}"
        )
    except KeyError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Invalid API response structure: missing key {str(e)}"
        )
    except Exception as e:
        print(f"Unexpected error: {type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

# Prompt templates
def create_review_prompt(code: str, language: str) -> str:
    return f"""You are an expert code reviewer. Analyze this {language} code comprehensively:

**Code to Review:**
{code}

text

**Provide detailed feedback on:**
1. **Correctness**: Any bugs, logical errors, or edge cases not handled
2. **Performance**: Optimization opportunities and efficiency concerns
3. **Style**: Code readability, naming conventions, and best practices
4. **Security**: Potential vulnerabilities or security issues
5. **Algorithm**: Better algorithms or data structures if applicable

Format your response with clear headings and actionable suggestions."""

def create_docstring_prompt(code: str, language: str) -> str:
    return f"""Generate comprehensive, professional documentation for this {language} code.

**Code:**
{code}

text

**Requirements:**
- Follow language-specific conventions (PEP 257 for Python, JSDoc for JavaScript, etc.)
- Include function/class description
- Document all parameters with types
- Document return values
- Add usage examples if helpful
- Keep it clear and concise

Return ONLY the docstring, not the code."""

# Health check endpoint
@app.get("/")
async def root():
    return {
        "message": "AI Code Review & Documentation API",
        "status": "online",
        "model": MODEL,
        "endpoints": {
            "analyze": "/api/analyze",
            "health": "/health"
        }
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model": MODEL}

# Main analysis endpoint
@app.post("/api/analyze", response_model=CodeAnalysisResponse)
async def analyze_code(request: CodeAnalysisRequest):
    """
    Analyze code and generate review + documentation
    
    - **code**: The code snippet to analyze
    - **language**: Programming language (python, javascript, java, cpp, etc.)
    """
    if not request.code.strip():
        raise HTTPException(status_code=400, detail="Code cannot be empty")
    
    print(f"\n[ANALYZE] Analyzing {request.language} code ({len(request.code)} chars)...")
    
    try:
        # Generate code review
        print("-> Generating code review...")
        review_prompt = create_review_prompt(request.code, request.language)
        review = await call_gemini(review_prompt)
        
        # Generate docstring
        print("-> Generating documentation...")
        docstring_prompt = create_docstring_prompt(request.code, request.language)
        docstring = await call_gemini(docstring_prompt)
        
        print("[DONE] Analysis complete!\n")
        
        return CodeAnalysisResponse(
            review=review,
            docstring=docstring,
            language=request.language
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Analysis failed: {str(e)}\n")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.post("/api/export-pdf")
async def export_pdf(request: PDFExportRequest):
    """
    Generate and export a PDF report containing original code, code review, and documentation.
    """
    try:
        print(f"\n[PDF] Exporting PDF for {request.language} code...")
        
        # 1. Format code with line numbers and escape html
        lines = request.code.splitlines()
        numbered_lines = []
        for i, line in enumerate(lines):
            numbered_lines.append(f"{i+1:3d} | {html.escape(line)}")
        formatted_code = "\n".join(numbered_lines)
        
        # 2. Convert markdown contents to HTML
        review_content = request.review or "No review available."
        docstring_content = request.docstring or "No documentation generated."
        
        # Setup markdown parser with fenced code and tables extensions
        md_parser = markdown.Markdown(extensions=['fenced_code', 'tables'])
        review_html = md_parser.convert(review_content)
        docstring_html = md_parser.convert(docstring_content)
        
        # 3. Build HTML document with premium styles compatible with xhtml2pdf
        html_template = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
    @page {{
        size: A4;
        margin: 2.5cm 2cm 2.5cm 2cm;
        @frame header_frame {{
            -pdf-frame-content: header_content;
            left: 2cm;
            width: 17cm;
            top: 1cm;
            height: 1cm;
        }}
        @frame footer_frame {{
            -pdf-frame-content: footer_content;
            left: 2cm;
            width: 17cm;
            bottom: 1cm;
            height: 1cm;
        }}
    }}
    
    body {{
        font-family: Helvetica, Arial, sans-serif;
        color: #334155;
        font-size: 10pt;
        line-height: 1.6;
    }}
    
    .cover-title {{
        font-size: 26pt;
        font-weight: bold;
        color: #1e3a8a;
        margin-top: 10px;
        margin-bottom: 5px;
    }}
    
    .cover-subtitle {{
        font-size: 12pt;
        color: #64748b;
        margin-bottom: 30px;
        border-bottom: 2px solid #e2e8f0;
        padding-bottom: 15px;
    }}
    
    .meta-table {{
        width: 100%;
        margin-bottom: 35px;
        border-collapse: collapse;
    }}
    
    .meta-table td {{
        padding: 8px 12px;
        border: 1px solid #e2e8f0;
    }}
    
    .meta-label {{
        font-weight: bold;
        color: #475569;
        background-color: #f8fafc;
        width: 25%;
    }}
    
    .meta-value {{
        color: #0f172a;
    }}
    
    h2 {{
        font-size: 16pt;
        color: #1e3a8a;
        margin-top: 30px;
        margin-bottom: 15px;
        border-bottom: 1px solid #cbd5e1;
        padding-bottom: 5px;
    }}
    
    h3 {{
        font-size: 12pt;
        color: #0f172a;
        margin-top: 20px;
        margin-bottom: 8px;
    }}
    
    p {{
        margin-bottom: 12px;
    }}
    
    ul, ol {{
        margin-left: 20px;
        margin-bottom: 15px;
    }}
    
    li {{
        margin-bottom: 6px;
    }}
    
    /* Code block styling — light theme for xhtml2pdf compatibility */
    pre {{
        font-family: Courier, monospace;
        background-color: #f1f5f9;
        color: #1e293b;
        border: 1px solid #cbd5e1;
        border-left: 4px solid #3b82f6;
        padding: 14px;
        margin: 15px 0;
        font-size: 8.5pt;
        line-height: 1.5;
    }}
    
    code {{
        font-family: Courier, monospace;
        background-color: #e2e8f0;
        color: #1e293b;
        padding: 1px 4px;
        font-size: 9pt;
    }}
    
    pre code {{
        background-color: transparent;
        color: inherit;
        padding: 0;
        font-size: inherit;
    }}
    
    .page-break {{
        page-break-before: always;
    }}
    
    .header-text {{
        text-align: right;
        font-size: 8pt;
        color: #94a3b8;
        border-bottom: 1px solid #e2e8f0;
        padding-bottom: 5px;
    }}
    
    .footer-text {{
        text-align: center;
        font-size: 8pt;
        color: #94a3b8;
        border-top: 1px solid #e2e8f0;
        padding-top: 5px;
    }}
    
    .badge {{
        display: inline-block;
        padding: 2px 6px;
        background-color: #dbeafe;
        color: #1e40af;
        border-radius: 4px;
        font-size: 8pt;
        font-weight: bold;
        text-transform: uppercase;
    }}
</style>
</head>
<body>
    <div id="header_content" class="header-text">
        CodeReview AI Report &bull; Confidential
    </div>
    
    <div id="footer_content" class="footer-text">
        Generated by CodeReview &bull; Page <pdf:pagenumber> of <pdf:pagecount>
    </div>

    <div class="cover-title">CodeReview Report</div>
    <div class="cover-subtitle">AI-Powered Analysis and Feedback</div>
    
    <table class="meta-table">
        <tr>
            <td class="meta-label">Language</td>
            <td class="meta-value"><span class="badge">{html.escape(request.language.capitalize())}</span></td>
        </tr>
        <tr>
            <td class="meta-label">Generated on</td>
            <td class="meta-value">{datetime.now().strftime("%Y-%m-%d %H:%M:%S")}</td>
        </tr>
        <tr>
            <td class="meta-label">Analysis Engine</td>
            <td class="meta-value">Gemini 2.5 Flash</td>
        </tr>
    </table>
    
    <h2>Original Code</h2>
    <pre>{formatted_code}</pre>
    
    <div class="page-break"></div>
    
    <h2>Code Review &amp; Feedback</h2>
    <div class="review-container">
        {review_html}
    </div>
    
    <div class="page-break"></div>
    
    <h2>Generated Documentation</h2>
    <div class="docs-container">
        {docstring_html}
    </div>
</body>
</html>
"""
        
        # 4. Generate PDF in memory
        pdf_buffer = io.BytesIO()
        pisa_status = pisa.CreatePDF(html_template, dest=pdf_buffer)
        
        if pisa_status.err:
            print("[ERROR] PDF generation failed in pisa")
            raise HTTPException(status_code=500, detail="PDF generation failed")
            
        pdf_buffer.seek(0)
        print("[DONE] PDF generated successfully!\n")
        
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=ai_report_{int(datetime.now().timestamp())}.pdf",
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] PDF generation route failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

# Run with: python -m uvicorn main:app --reload --port 8000
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)