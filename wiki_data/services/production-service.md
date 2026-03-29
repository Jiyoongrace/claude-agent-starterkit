---
비즈니스_태그: [생산, MSA, 대기량, PROD_DB]
연관_DB_테이블: TB_PRODUCTION, TB_PROD_QUEUE
관련_API: GET /api/production, GET /api/production/queue
연관_시나리오: [S7]
담당_에이전트: 트레이서
---

# 생산 서비스 (Production Service) API 명세

## 서비스 개요

**생산 서비스**는 주문 서비스로부터 작업 지시를 받아 실제 생산 공정을 관리하는 MSA 컴포넌트입니다.
데이터베이스: `PROD_DB` (PostgreSQL)

## 주요 테이블

### TB_PRODUCTION

| 컬럼 | 타입 | 설명 |
|---|---|---|
| prod_id | VARCHAR(20) | 생산 ID (PK) |
| order_id | VARCHAR(20) | 주문 번호 (FK from ORDER_DB) |
| slab_id | VARCHAR(20) | 슬라브 ID |
| status | ENUM | WAITING / IN_PROGRESS / COMPLETED |
| qty | DECIMAL(10,2) | 실제 생산 수량 (ton) |
| started_at | TIMESTAMP | 생산 시작 시각 |
| completed_at | TIMESTAMP | 생산 완료 시각 |

## API 엔드포인트

```
GET  /api/production              — 전체 생산 목록 조회
GET  /api/production/{prod_id}    — 특정 생산 상세 조회
GET  /api/production/queue        — 현재 생산 대기 큐
PUT  /api/production/{prod_id}    — 생산 상태 업데이트
```

## 동기화 이슈

생산 서비스는 주문 서비스의 상태를 이벤트 기반으로 수신합니다.
이벤트 브로커: Kafka (`order.status.changed` 토픽)

**알려진 문제**: Kafka 컨슈머 지연 시 두 DB 간 상태 불일치 발생 가능.
`TB_PRODUCTION.status`가 `TB_ORDER.status`보다 늦게 업데이트되는 현상.
