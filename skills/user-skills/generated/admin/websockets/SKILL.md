---
name: webiny-admin-websockets-catalog
description: >
  admin/websockets — 1 abstractions.
---

# admin/websockets

## How to Use

1. Find the abstraction you need below
2. You MUST read the source file to get the exact interface and types!
3. Import: `import { Name } from "<importPath>";`

## Abstractions

---

**Name:** `WebsocketEventHandler`
**Import:** `import { WebsocketEventHandler } from "webiny/admin/websockets"`
**Source:** `@webiny/app-websockets/events/abstractions.ts`
**Description:** Handlers registered against this abstraction receive EVERY incoming websocket message
(published as a `WebsocketEvent` by the websockets→EventPublisher bridge). Each handler
is responsible for filtering by `event.payload.action` and reacting to the ones it cares
about, instead of subscribing to the websocket service directly.

---
