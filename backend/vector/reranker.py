"""
Cross-encoder 리랭킹 모듈.

onTong 프로젝트의 리랭킹 패턴을 적용:
  - sentence-transformers CrossEncoder 기반
  - Lazy 초기화 (최초 rerank() 호출 시 모델 로딩)
  - ENABLE_RERANKER=true 환경변수로 활성화 (기본 비활성)
  - 실패 시 원본 순서로 안전하게 폴백
"""
import os
from typing import Optional

_reranker_model: Optional[object] = None


def _get_model(model_name: str) -> Optional[object]:
    """CrossEncoder 모델 Lazy 초기화."""
    global _reranker_model
    if _reranker_model is None:
        try:
            from sentence_transformers import CrossEncoder
            print(f"[Reranker] 모델 로딩: {model_name}")
            _reranker_model = CrossEncoder(model_name)
            print("[Reranker] 모델 로딩 완료")
        except Exception as e:
            print(f"[Reranker] 모델 로딩 실패: {e}")
            return None
    return _reranker_model


def rerank(
    query: str,
    documents: list[dict],
    top_k: int = 3,
    model_name: Optional[str] = None,
) -> list[dict]:
    """
    Cross-encoder로 검색 결과를 재정렬.

    ENABLE_RERANKER=true가 아니면 documents[:top_k]를 즉시 반환.
    실패 시 원본 순서로 폴백.

    Args:
        query:      검색 쿼리
        documents:  [{"content": str, "metadata": dict, ...}] 리스트
        top_k:      리랭킹 후 반환할 결과 수
        model_name: CrossEncoder 모델명 (None이면 환경변수 또는 기본값 사용)

    Returns:
        리랭킹된 [{"content": str, "metadata": dict, "rerank_score": float}] 리스트
    """
    if not os.getenv("ENABLE_RERANKER", "false").lower() == "true":
        return documents[:top_k]

    if not documents:
        return []

    _model_name = (
        model_name
        or os.getenv("RERANKER_MODEL", "cross-encoder/ms-marco-MiniLM-L-6-v2")
    )

    try:
        model = _get_model(_model_name)
        if model is None:
            return documents[:top_k]

        pairs = [(query, doc.get("content", "")) for doc in documents]
        scores = model.predict(pairs)  # type: ignore

        ranked = sorted(
            zip(scores, documents),
            key=lambda x: float(x[0]),
            reverse=True,
        )
        result = []
        for score, doc in ranked[:top_k]:
            item = dict(doc)
            item["rerank_score"] = float(score)
            result.append(item)
        return result

    except Exception as e:
        print(f"[Reranker] 리랭킹 실패 → 원본 순서 반환: {e}")
        return documents[:top_k]
