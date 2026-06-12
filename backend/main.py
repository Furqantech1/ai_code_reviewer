from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import httpx
from typing import Dict

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

# Run with: python -m uvicorn main:app --reload --port 8000
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)