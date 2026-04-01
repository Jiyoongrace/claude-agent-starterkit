"""
스킬 매처 — 시나리오 ID 또는 쿼리 키워드로 최적 스킬을 선택합니다.
"""
from typing import Optional
from skills.loader import load_all_skills

# 시나리오 ID → skill_id 빠른 조회 캐시
_scenario_to_skill: dict[str, str] = {}


def _build_scenario_index() -> None:
    """시나리오 ID → skill_id 인덱스 구축."""
    global _scenario_to_skill
    if _scenario_to_skill:
        return
    for skill_id, skill in load_all_skills().items():
        for scenario in skill.get("scenarios", []):
            _scenario_to_skill[scenario] = skill_id


def match_skill(query: str, scenario_id: Optional[str] = None) -> Optional[str]:
    """
    시나리오 ID 또는 쿼리로 최적 스킬의 마크다운 본문을 반환.

    매칭 우선순위:
      1. scenario_id가 있으면 해당 시나리오 스킬 직접 반환 (O(1))
      2. 없으면 쿼리에서 키워드 히트 수 최다 스킬 선택

    None 반환 시 에이전트는 기존 하드코딩 시스템 프롬프트로 폴백합니다.
    """
    _build_scenario_index()
    skills = load_all_skills()

    # 1. 시나리오 ID 직접 매칭
    if scenario_id and scenario_id in _scenario_to_skill:
        skill_id = _scenario_to_skill[scenario_id]
        skill = skills.get(skill_id)
        return skill["content"] if skill else None

    # 2. 쿼리 키워드 히트 수 매칭
    if not query:
        return None

    query_lower = query.lower()
    best_skill_id: Optional[str] = None
    best_hits = 0

    for skill_id, skill in skills.items():
        hits = sum(
            1 for kw in skill.get("keywords", [])
            if kw.lower() in query_lower
        )
        if hits > best_hits:
            best_hits = hits
            best_skill_id = skill_id

    if best_skill_id and best_hits > 0:
        return skills[best_skill_id]["content"]

    return None
