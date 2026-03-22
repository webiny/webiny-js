---
name: webiny-api-event-publisher-catalog
context: webiny-api
description: >
  api/event-publisher — 2 abstractions.
---

# api/event-publisher

## How to Use

1. Find the abstraction you need below
2. Read the source file to get the exact interface and types
3. Import: `import { ClassName } from "<importPath>";`
4. See `webiny-use-case-pattern` or `webiny-event-handler-pattern` skills for implementation patterns

## Abstractions

---
**Class:** `DomainEvent`
**Import:** `webiny/api/event-publisher`
**Source:** `@webiny/api-core/features/eventPublisher/index.ts`
**Description:** Base class for all domain events.

---
**Class:** `EventPublisher`
**Import:** `webiny/api/event-publisher`
**Source:** `@webiny/api-core/features/eventPublisher/index.ts`
**Description:** Publish domain events to registered handlers.

---
