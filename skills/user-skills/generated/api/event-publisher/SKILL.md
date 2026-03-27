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
3. Import: `import { Name } from "<importPath>";`
4. See `webiny-use-case-pattern` or `webiny-event-handler-pattern` skills for implementation patterns

## Abstractions

---

**Name:** `DomainEvent`
**Import:** `import { DomainEvent } from "webiny/api/event-publisher"`
**Source:** `@webiny/api-core/features/eventPublisher/index.ts`
**Description:** Base class for all domain events.

---

**Name:** `EventPublisher`
**Import:** `import { EventPublisher } from "webiny/api/event-publisher"`
**Source:** `@webiny/api-core/features/eventPublisher/index.ts`
**Description:** Publish domain events to registered handlers.

---
