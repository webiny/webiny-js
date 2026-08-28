---
name: webiny-websocket-notifications
description: >
  Sending real-time notifications from the API to the Admin app over websockets, and
  reacting to them on the client. Use this skill when the developer wants to push a
  message to the user who triggered some server-side work (e.g. per-entry progress from a
  background task/bulk action) and show a toast, update a cache, or refresh UI in response.
  Requires Webiny 6.5.0 or newer.
---

# Websocket notifications (API → Admin)

## TL;DR

On the **API**, inject `WebsocketsSendToIdentityUseCase` (`webiny/api`) + `IdentityContext`
(`webiny/api/security`) and call `sendToIdentity.execute({ id }, { action, data })`. On the
**Admin**, implement a `WebsocketEventHandler` (`webiny/admin/websockets`) that filters on
`action` and reacts (e.g. toast via `Notifications` from `webiny/admin`), registered with
`createFeature` + `RegisterFeature`.

## API — emit

```typescript
import { WebsocketsSendToIdentityUseCase } from "webiny/api";
import { IdentityContext } from "webiny/api/security";

class MyTaskOrHook {
  constructor(
    private identityContext: IdentityContext.Interface,
    private sendToIdentity: WebsocketsSendToIdentityUseCase.Interface
  ) {}

  async notify(entry) {
    // Best-effort: a websocket failure must never fail the real work.
    try {
      const identity = this.identityContext.getIdentity();
      if (identity) {
        await this.sendToIdentity.execute(
          { id: identity.id },
          {
            action: "cms.product.discountApplied",
            data: { id: entry.entryId, price: entry.values.price }
          }
        );
      }
    } catch (ex) {
      // log & swallow
    }
  }
}
// dependencies: [IdentityContext, WebsocketsSendToIdentityUseCase]
```

- Send to the user who triggered the work — get them from `IdentityContext`. In a
  background task/bulk action, the triggering identity is available.
- Use a namespaced `action` string; put the payload in `data`.
- Sender data type: `{ action?: string; data?: T; error?: {...} }`.

## Admin — listen

```typescript
import { WebsocketEventHandler } from "webiny/admin/websockets";
import { Notifications } from "webiny/admin";

const ACTION = "cms.product.discountApplied";

class MyHandlerImpl implements WebsocketEventHandler.Interface {
  constructor(private notifications: Notifications.Interface) {}

  async handle(event: WebsocketEventHandler.Event): Promise<void> {
    const payload = event.payload as { action?: string; data?: { id: string; price: number } };
    if (payload.action !== ACTION || !payload.data) {
      return; // every handler sees every message — filter by action
    }
    this.notifications.success({
      title: "Discount applied",
      description: `New price ${payload.data.price}.`
    });
  }
}

export const MyHandler = WebsocketEventHandler.createImplementation({
  implementation: MyHandlerImpl,
  dependencies: [Notifications]
});
```

Read the message off `event.payload` — `event.payload.action` and `event.payload.data`
(the exact `{ action, data }` object the API sent).

## Admin — register

Register the handler in a feature and render it from your `Admin.Extension`:

```tsx
import { createFeature, RegisterFeature } from "webiny/admin";
import { MyHandler } from "./MyHandler.js";

const MyFeature = createFeature({
  name: "MyExtension/Notifications",
  register(container) {
    container.register(MyHandler);
  }
});

export default () => <RegisterFeature feature={MyFeature} />;
```

The websockets runner resolves every registered `WebsocketEventHandler` and calls `handle`
for each incoming message — hence the `action` filter in each handler.

## Related

- `webiny-cms-bulk-actions` — the typical emitter: a bulk action's `processData` sends a
  message per processed entry so the Admin can toast progress live.
