"""
하이브리드 검색 모듈 — BM25 + ChromaDB 벡터 검색을 RRF로 병합.

onTong 프로젝트의 하이브리드 검색 패턴을 적용:
  - BM25 키워드 검색 (rank-bm25, 인메모리)
  - ChromaDB 의미 검색
  - RRF(Reciprocal Rank Fusion, k=60)으로 병합

서버 시작 시 wiki_indexer.index_all_wiki() 호출과 동시에 build_bm25_index()가
호출되어 인메모리 인덱스가 구축됩니다.
"""
import re
from typing import Optional

from vector.chroma_client import get_collection
from vector.wiki_indexer import search_wiki

try:
    from rank_bm25 import BM25Okapi
    _BM25_AVAILABLE = True
except ImportError:
    _BM25_AVAILABLE = False

# 모듈 수준 인메모리 인덱스
_bm25_index: Optional["BM25Okapi"] = None  # type: ignore
_bm25_doc_ids: list[str] = []       # ChromaDB id와 1:1 매핑
_bm25_doc_texts: list[str] = []     # 원문 (내용 반환용)
_bm25_doc_metas: list[dict] = []    # 메타데이터


def _tokenize(text: str) -> list[str]:
    """한국어/영어 혼용 텍스트 토크나이징 (공백 + 특수문자 분리)."""
    text = re.sub(r"[^\w가-힣a-zA-Z0-9]", " ", text)
    return [t for t in text.split() if t]


def build_bm25_index(documents: list[str], doc_ids: list[str], metadatas: list[dict]) -> None:
    """
    BM25 인메모리 인덱스 구축.
    wiki_indexer.index_all_wiki() 완료 후 호출됩니다.

    Args:
        documents: 마크다운 본문 리스트
        doc_ids:   ChromaDB에 저장한 파일 경로 (동일 키)
        metadatas: 문서 메타데이터 리스트
    """
    global _bm25_index, _bm25_doc_ids, _bm25_doc_texts, _bm25_doc_metas

    if not _BM25_AVAILABLE:
        print("[BM25] rank-bm25 미설치 → BM25 인덱스 구축 건너뜀")
        return

    if not documents:
        return

    tokenized = [_tokenize(doc) for doc in documents]
    _bm25_index = BM25Okapi(tokenized)
    _bm25_doc_ids = list(doc_ids)
    _bm25_doc_texts = list(documents)
    _bm25_doc_metas = list(metadatas)
    print(f"[BM25] {len(documents)}개 문서 인덱스 구축 완료")


def hybrid_search(
    query: str,
    n_results: int = 5,
    chroma_weight: float = 0.6,
    bm25_weight: float = 0.4,
) -> list[dict]:
    """
    BM25 + ChromaDB 벡터 검색을 RRF로 병합하여 반환.

    BM25 인덱스가 없으면 ChromaDB 벡터 검색 단독으로 폴백.

    Args:
        query:          검색 쿼리
        n_results:      최종 반환 결과 수
        chroma_weight:  ChromaDB 결과 가중치 (기본 0.6)
        bm25_weight:    BM25 결과 가중치 (기본 0.4)

    Returns:
        [{"content": str, "metadata": dict, "score": float}]
    """
    # BM25 인덱스 없으면 기존 벡터 검색으로 폴백
    if _bm25_index is None or not _BM25_AVAILABLE:
        results = search_wiki(query, n_results=n_results)
        for r in results:
            r.setdefault("score", 1.0)
        return results

    candidate_count = n_results * 3
    k = 60  # 표준 RRF 상수

    # --- ChromaDB 벡터 검색 ---
    chroma_results = search_wiki(query, n_results=candidate_count)
    chroma_rank: dict[str, int] = {}
    chroma_content: dict[str, dict] = {}
    for rank, item in enumerate(chroma_results):
        doc_id = item["metadata"].get("source", f"chroma_{rank}")
        chroma_rank[doc_id] = rank
        chroma_content[doc_id] = item

    # --- BM25 검색 ---
    tokenized_query = _tokenize(query)
    bm25_scores = _bm25_index.get_scores(tokenized_query)
    bm25_ranked = sorted(
        range(len(bm25_scores)), key=lambda i: bm25_scores[i], reverse=True
    )[:candidate_count]
    bm25_rank: dict[str, int] = {}
    bm25_content: dict[str, dict] = {}
    for rank, idx in enumerate(bm25_ranked):
        doc_id = _bm25_doc_metas[idx].get("source", f"bm25_{idx}")
        bm25_rank[doc_id] = rank
        bm25_content[doc_id] = {
            "content": _bm25_doc_texts[idx],
            "metadata": _bm25_doc_metas[idx],
        }

    # --- RRF 병합 ---
    all_doc_ids = set(chroma_rank.keys()) | set(bm25_rank.keys())
    rrf_scores: dict[str, float] = {}

    for doc_id in all_doc_ids:
        score = 0.0
        if doc_id in chroma_rank:
            score += chroma_weight / (k + chroma_rank[doc_id])
        if doc_id in bm25_rank:
            score += bm25_weight / (k + bm25_rank[doc_id])
        rrf_scores[doc_id] = score

    sorted_ids = sorted(rrf_scores.keys(), key=lambda d: rrf_scores[d], reverse=True)

    results = []
    for doc_id in sorted_ids[:n_results]:
        item = chroma_content.get(doc_id) or bm25_content.get(doc_id, {})
        results.append({
            "content": item.get("content", ""),
            "metadata": item.get("metadata", {}),
            "score": rrf_scores[doc_id],
        })

    return results
