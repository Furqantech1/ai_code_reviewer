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
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OpenRouter API configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
MODEL = "tngtech/deepseek-r1t2-chimera:free"

print(f"✓ API Key loaded: {'Yes' if OPENROUTER_API_KEY else 'No'}")
print(f"✓ Model: {MODEL}")

# Helper function to call DeepSeek via OpenRouter
async def call_deepseek(prompt: str) -> str:
    """Call DeepSeek-V3 via OpenRouter API with proper error handling"""
    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=500, detail="API key not configured")
    
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{OPENROUTER_BASE_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "HTTP-Referer": "http://localhost:8000",
                    "X-Title": "AI Code Review Tool",
                    "Content-Type": "application/json"
                },
                json={
                    "model": MODEL,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.3,
                    "max_tokens": 2000
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
                    detail=f"OpenRouter API error: {error_text}"
                )
            
            # Parse response JSON
            response_data = response.json()
            print(f"API Response Keys: {response_data.keys()}")
            
            # Check if 'choices' exists in response
            if 'choices' not in response_data:
                print(f"Full API Response: {response_data}")
                # Handle error response format
                if 'error' in response_data:
                    error_msg = response_data['error'].get('message', 'Unknown error')
                    raise HTTPException(status_code=500, detail=f"API Error: {error_msg}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Unexpected API response format: {response_data}"
                )
            
            # Extract the content
            if len(response_data['choices']) == 0:
                raise HTTPException(status_code=500, detail="API returned empty choices")
            
            return response_data['choices'][0]['message']['content']
            
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
    
    print(f"\n📝 Analyzing {request.language} code ({len(request.code)} chars)...")
    
    try:
        # Generate code review
        print("→ Generating code review...")
        review_prompt = create_review_prompt(request.code, request.language)
        review = await call_deepseek(review_prompt)
        
        # Generate docstring
        print("→ Generating documentation...")
        docstring_prompt = create_docstring_prompt(request.code, request.language)
        docstring = await call_deepseek(docstring_prompt)
        
        print("✓ Analysis complete!\n")
        
        return CodeAnalysisResponse(
            review=review,
            docstring=docstring,
            language=request.language
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"✗ Analysis failed: {str(e)}\n")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

# Run with: python -m uvicorn main:app --reload --port 8000
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)