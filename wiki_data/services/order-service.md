---
비즈니스_태그: [주문, MSA, 대기량, ORDER_DB]
연관_DB_테이블: TB_ORDER, TB_ORDER_QUEUE
관련_API: GET /api/orders, GET /api/orders/queue
연관_시나리오: [S7]
담당_에이전트: 트레이서
---

# 주문 서비스 (Order Service) API 명세

## 서비스 개요

**주문 서비스**는 고객 주문을 접수하고 생산 계획 서비스로 전달하는 MSA 컴포넌트입니다.
데이터베이스: `ORDER_DB` (PostgreSQL)

## 주요 테이블

### TB_ORDER

| 컬럼 | 타입 | 설명 |
|---|---|---|
| order_id | VARCHAR(20) | 주문 번호 (PK) |
| slab_id | VARCHAR(20) | 슬라브 ID (FK) |
| status | ENUM | WAITING / IN_PROGRESS / COMPLETED / CANCELLED |
| qty | DECIMAL(10,2) | 주문 수량 (ton) |
| created_at | TIMESTAMP | 주문 생성 시각 |

### TB_ORDER_QUEUE

| 컬럼 | 타입 | 설명 |
|---|---|---|
| queue_id | BIGINT | 큐 순번 (PK) |
| order_id | VARCHAR(20) | 주문 번호 (FK) |
| priority | INT | 처리 우선순위 (1=최고) |
| enqueued_at | TIMESTAMP | 큐 등록 시각 |

## API 엔드포인트

```
GET  /api/orders              — 전체 주문 목록 조회
GET  /api/orders/{order_id}   — 특정 주문 상세 조회
GET  /api/orders/queue        — 현재 대기 큐 조회
POST /api/orders              — 신규 주문 등록
PUT  /api/orders/{order_id}   — 주문 상태 변경
```

## 알려진 이슈

> **MSA 대기량 불일치 (S7)**: 주문 서비스의 `status=WAITING` 건수가 생산 서비스의 대기량과
> 주기적으로 불일치하는 현상 발견. 원인 추적 진행 중.
