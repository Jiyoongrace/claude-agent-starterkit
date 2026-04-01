"""
스킬 파일 로더 — wiki_data/_skills/*.md 파일을 로딩하고 캐싱합니다.
"""
import os
from pathlib import Path
from typing import Optional

try:
    import frontmatter
    _FM_AVAILABLE = True
except ImportError:
    _FM_AVAILABLE = False

# wiki_data/_skills/ 기본 경로 (backend/ 기준 상대 경로)
_DEFAULT_SKILLS_DIR = Path(__file__).parent.parent.parent / "wiki_data" / "_skills"

# 모듈 수준 캐시 (서버 재시작으로 갱신)
_skill_cache: dict[str, dict] = {}


def _get_skills_dir() -> Path:
    env = os.getenv("SKILLS_DIR", "")
    return Path(env).resolve() if env else _DEFAULT_SKILLS_DIR


def load_all_skills() -> dict[str, dict]:
    """
    _skills/ 디렉토리의 모든 스킬 파일을 로딩하여 반환.

    반환값:
        {
          skill_id: {
            "content": str,          # 마크다운 본문 (시스템 프롬프트로 사용)
            "keywords": list[str],   # 키워드 매칭용
            "scenarios": list[str],  # 대응 시나리오 ID 목록 (예: ["S4"])
          }
        }
    """
    global _skill_cache

    if _skill_cache:
        return _skill_cache

    skills_dir = _get_skills_dir()
    if not skills_dir.exists():
        print(f"[Skills] 스킬 디렉토리 없음: {skills_dir}")
        return {}

    loaded = 0
    for md_file in skills_dir.glob("*.md"):
        try:
            if _FM_AVAILABLE:
                post = frontmatter.load(str(md_file))
                content = post.content.strip()
                meta = post.metadata
            else:
                raw = md_file.read_text(encoding="utf-8")
                content = raw.strip()
                meta = {}

            skill_id = meta.get("skill_id", md_file.stem.replace("-", "_"))
            keywords = meta.get("keywords", [])
            scenarios = meta.get("scenarios", [])

            # 리스트 정규화
            if isinstance(keywords, str):
                keywords = [k.strip() for k in keywords.split(",")]
            if isinstance(scenarios, str):
                scenarios = [s.strip() for s in scenarios.split(",")]

            _skill_cache[skill_id] = {
                "content": content,
                "keywords": keywords,
                "scenarios": [str(s) for s in scenarios],
            }
            loaded += 1
        except Exception as e:
            print(f"[Skills] 스킬 파일 로딩 실패 ({md_file.name}): {e}")

    print(f"[Skills] {loaded}개 스킬 로딩 완료")
    return _skill_cache


def load_skill(skill_id: str) -> Optional[str]:
    """
    특정 skill_id의 마크다운 본문을 반환.
    없으면 None 반환 → 에이전트가 기존 하드코딩 프롬프트로 폴백.
    """
    skills = load_all_skills()
    skill = skills.get(skill_id)
    return skill["content"] if skill else None
