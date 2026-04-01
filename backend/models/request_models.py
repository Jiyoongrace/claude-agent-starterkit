from pydantic import BaseModel
from typing import Literal, Any, Optional

ScenarioId = Literal["S1", "S2", "S3", "S4", "S5", "S6", "S7"]


class AgentRunRequest(BaseModel):
    scenario_id: ScenarioId
    params: dict[str, Any] = {}


class ChatRequest(BaseModel):
    """Wiki Chat 엔드포인트 요청 모델."""
    message: str
    history: list[dict[str, str]] = []      # [{"role": "user"|"assistant", "content": str}]
    scenario_id: Optional[str] = None        # 스킬 자동 매칭 힌트
    n_context_docs: int = 3                  # 컨텍스트로 주입할 Wiki 문서 수
