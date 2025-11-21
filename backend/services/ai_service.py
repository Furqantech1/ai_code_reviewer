import os
import httpx
from typing import Dict

class AIService:
    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        self.base_url = "https://openrouter.ai/api/v1"
        self.model = "deepseek/deepseek-chat"
    
    async def analyze_code(self, code: str, language: str) -> Dict[str, str]:
        # Code Review with reasoning enabled
        review = await self._call_llm(
            self._create_review_prompt(code, language),
            reasoning=True
        )
        
        # Docstring generation without reasoning for speed
        docstring = await self._call_llm(
            self._create_docstring_prompt(code, language),
            reasoning=False
        )
        
        return {"review": review, "docstring": docstring}
    
    async def _call_llm(self, prompt: str, reasoning: bool) -> str:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "HTTP-Referer": "http://localhost:3000",
                    "X-Title": "Code Review Tool"
                },
                json={
                    "model": self.model,
                    "messages": [{"role": "user", "content": prompt}],
                    "reasoning": reasoning,
                    "temperature": 0.3
                }
            )
            return response.json()["choices"][0]["message"]["content"]
    
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