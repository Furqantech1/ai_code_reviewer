from pydantic import BaseModel

class CodeAnalysisRequest(BaseModel):
    code: str
    language: str

class CodeAnalysisResponse(BaseModel):
    review: str
    docstring: str
    language: str
