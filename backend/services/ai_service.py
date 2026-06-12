import os
import httpx
from typing import Dict

class AIService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY") or os.getenv("OPENROUTER_API_KEY")
        self.model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models"
    
    async def analyze_code(self, code: str, language: str) -> Dict[str, str]:
        # Code Review
        review = await self._call_llm(
            self._create_review_prompt(code, language)
        )
        
        # Docstring generation
        docstring = await self._call_llm(
            self._create_docstring_prompt(code, language)
        )
        
        return {"review": review, "docstring": docstring}
    
    async def _call_llm(self, prompt: str) -> str:
        if not self.api_key:
            raise Exception("Gemini API key not configured")
        
        url = f"{self.base_url}/{self.model}:generateContent?key={self.api_key}"
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                url,
                headers={"Content-Type": "application/json"},
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"temperature": 0.3}
                }
            )
            response_data = response.json()
            if 'error' in response_data:
                raise Exception(response_data['error'].get('message', 'Unknown error'))
            return response_data['candidates'][0]['content']['parts'][0]['text']
    
    def _create_review_prompt(self, code: str, language: str) -> str:
        return f"""You are an expert code reviewer. Analyze this {language} code for:
1. Code correctness and potential bugs
2. Performance optimizations
3. Style and best practices
4. Security vulnerabilities
5. Algorithm efficiency

Code:
{code}

text

Provide actionable feedback with specific suggestions."""

    def _create_docstring_prompt(self, code: str, language: str) -> str:
        return f"""Generate comprehensive docstrings for this {language} code.
Follow language-specific conventions (PEP 257 for Python, JSDoc for JavaScript, etc.).

Code:
{code}

text

Return only the docstring without the original code."""