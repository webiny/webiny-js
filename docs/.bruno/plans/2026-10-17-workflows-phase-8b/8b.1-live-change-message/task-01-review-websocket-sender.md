### Task 1: `ReviewWebsocketSender`

Spec 12; D132, D149; R87, R188, R196, R197, R253, R255; A63, A65; Review Focus 3 (the tenant filter and the never-throw rule are pinned here, the recipients in Task 2). Every Global Constraint of 8a and 8b applies (read `../00-shared.md` and the 8a `00-shared.md` "Global Constraints" before starting; R202, R204, R210, R220, R237, R238, R243 are admin rules and do not apply to this API task). One change, no new behaviour: the tenant-scoped, batched websocket send loop of `ReviewNotifierService` moves into its own service, `ReviewWebsocketSender`, so that Task 2's change notifier can use the same loop. The sender takes recipient ids, a websocket action and the frame data; it keeps every property of the old loop (current tenant only, `NOTIFICATION_SEND_CONCURRENCY` = 10 recipients at a time, never rejects, the same log text and the same log fields).

- **`ReviewWebsocketSender.send(params)`** (`params.recipientIds`, `params.action`, `params.data`, and `params.reviewId`, `params.event` for log fields only).
  - Removes duplicate ids, then every id that is not a non-empty string (an empty `identityId` would list every connection). No id left: returns at once, without reading the tenant and without logging.
  - Reads the current tenant (`TenantContext.getTenant()?.id` inside `try`/`catch`). No tenant or a throwing read: logs `Could not send a workflow websocket notification.` once, with the error code and name of a thrown error, `reviewId` and `event`, and sends nothing.
  - For each id, in batches of `NOTIFICATION_SEND_CONCURRENCY` with `Promise.all`: lists the connections (`where: { identityId }`), keeps those whose `tenant` equals the current tenant, maps them to `{ connectionId, endpoint }`, and with at least one sends `{ action, data }` through `WebsocketsSendToConnectionsUseCase`. A failed list, a failed send and a throw are each logged once with that text and `errorCode`, `errorName`, `errorMessage`, `reviewId`, `event`, `recipientId`; the other recipients still get their frame.
- **`ReviewNotifierService`** keeps de-duplicating its recipients (the transports need them) and returning for none; it builds the same R187 frame data and hands it to the sender (`action: WORKFLOWS_NOTIFICATION_WEBSOCKET_ACTION`, `event` the notification event). Transports are unchanged. The call to the sender sits in an inline `try`/`catch` that logs `Could not send a workflow websocket notification.` (code and name, `reviewId`, `event`), so a rejecting decorator cannot skip the transports (R87). Its dependencies lose the two websocket use cases and `TenantContext` and gain `ReviewWebsocketSender`.
- `ReviewWebsocketSenderFeature` is registered by `ReviewNotificationsFeature` before the notifier.
- The phase 7 notifier tests keep every assertion (the sender behaves as the loop did); their setup gains one registration line (R255), and the feature test's registration list gains the sender. `ReviewNotifications.test.ts` and `ReviewNotificationsBackgroundTask.test.ts` stay green unchanged.

**Files:**
- Create: `packages/api-workflows/src/features/notifications/ReviewWebsocketSender/abstractions.ts`
- Create: `packages/api-workflows/src/features/notifications/ReviewWebsocketSender/ReviewWebsocketSender.ts`
- Create: `packages/api-workflows/src/features/notifications/ReviewWebsocketSender/feature.ts`
- Create: `packages/api-workflows/src/features/notifications/ReviewWebsocketSender/index.ts`
- Modify: `packages/api-workflows/src/features/notifications/ReviewNotifierService/ReviewNotifierService.ts`
- Modify: `packages/api-workflows/src/features/notifications/feature.ts`
- Create: `packages/api-workflows/__tests__/__helpers/RecordingReviewWebsocketSender.ts`
- Create: `packages/api-workflows/__tests__/notifications/ReviewWebsocketSender.test.ts`
- Modify: `packages/api-workflows/__tests__/notifications/ReviewNotifierService.test.ts`
- Modify: `packages/api-workflows/__tests__/notifications/ReviewNotificationsFeature.test.ts`

**Interfaces:**
- Consumes (all existing, verified in the source):
  - `WebsocketsListConnectionsUseCase`, `WebsocketsSendToConnectionsUseCase` (`@webiny/api-websockets/exports/api.js`; `execute(connections, { action, data })` takes `data: T extends GenericRecord`, and an `object` is assignable to it).
  - `TenantContext` (`@webiny/api-core/features/tenancy/TenantContext/index.js`), `Logger` (`@webiny/api-core/features/logger/index.js`).
  - `NOTIFICATION_SEND_CONCURRENCY`, `WORKFLOWS_NOTIFICATION_WEBSOCKET_ACTION` (`~/domain/notifications/constants.js`), `getErrorLogFields` (`~/domain/notifications/getErrorLogFields.js`), `WorkflowNotificationWebsocketData` (`~/domain/notifications/types.js`).
  - Test helpers: `createContextHandler` (`~tests/__helpers/handler.js`), `captureLoggedErrors`, `loggedErrors` (`CapturingLogger.js`), `registerFaultyTenantContext`, `tenantFault` (`FaultyTenantContext.js`), `FakeWebsocketConnections` (`connect`, `calls`, `mode`, `onlyFor`, `holdMs`, `maxInFlight`), `RecordingWebsocketsSend` (`sent`, `mode`, `onlyFor`, `holdMs`, `maxInFlight`).
- Produces (matches the contract):
  - `ReviewWebsocketSender = createAbstraction<IReviewWebsocketSender>("Workflows/ReviewWebsocketSender")`, `IReviewWebsocketSender { send(params: ReviewWebsocketSendParams): Promise<void> }`, `ReviewWebsocketSendParams { reviewId: string; event: string; recipientIds: string[]; action: string; data: object }`; namespace `ReviewWebsocketSender.Interface`, `.SendParams`. Exported from `~/features/notifications/ReviewWebsocketSender/index.js` together with `ReviewWebsocketSenderFeature`.
  - Test helper `RecordingReviewWebsocketSender` (`calls`, `mode`), reused by Task 2.

- [ ] **Step 1: Write the failing tests**

Create `packages/api-workflows/__tests__/__helpers/RecordingReviewWebsocketSender.ts`:

```ts
import { ReviewWebsocketSender } from "~/features/notifications/ReviewWebsocketSender/index.js";

/**
 * Stands in for the sender in the notifier tests: records every `send` call (cloned), and with
 * `mode: "throw"` rejects, which the real sender never does, to prove a caller survives it.
 * Register with `container.registerInstance(ReviewWebsocketSender, sender)`.
 */
export class RecordingReviewWebsocketSender implements ReviewWebsocketSender.Interface {
    public readonly calls: ReviewWebsocketSender.SendParams[] = [];
    public mode: "ok" | "throw" = "ok";

    public async send(params: ReviewWebsocketSender.SendParams): Promise<void> {
        this.calls.push(structuredClone(params));
        if (this.mode === "throw") {
            throw new Error("The sender crashed.");
        }
    }
}
```

Create `packages/api-workflows/__tests__/notifications/ReviewWebsocketSender.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import {
    WebsocketsListConnectionsUseCase,
    WebsocketsSendToConnectionsUseCase
} from "@webiny/api-websockets/exports/api.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { registerFaultyTenantContext, tenantFault } from "~tests/__helpers/FaultyTenantContext.js";
import { FakeWebsocketConnections } from "~tests/__helpers/FakeWebsocketConnections.js";
import { RecordingWebsocketsSend } from "~tests/__helpers/RecordingWebsocketsSend.js";
import {
    ReviewWebsocketSender,
    ReviewWebsocketSenderFeature
} from "~/features/notifications/ReviewWebsocketSender/index.js";

const SECRET = "SECRET-TOKEN-4711";
const WEBSOCKET_TEXT = "Could not send a workflow websocket notification.";
const ACTION = "test.action";
const EVENT = "stepStarted";
const ANNA = "user-anna";
const BOB = "user-bob";

const DATA = { reviewId: "review-1", note: "plain data" };

const setup = async () => {
    const connections = new FakeWebsocketConnections();
    const sends = new RecordingWebsocketsSend();
    const { context } = await createContextHandler({
        setup: container => {
            captureLoggedErrors(container);
            registerFaultyTenantContext(container);
            container.registerInstance(WebsocketsListConnectionsUseCase, connections);
            container.registerInstance(WebsocketsSendToConnectionsUseCase, sends);
            ReviewWebsocketSenderFeature.register(container);
        }
    });
    const sender = context.container.resolve(ReviewWebsocketSender);
    const tenantId = context.container.resolve(TenantContext).getTenant().id;

    return {
        connections,
        sends,
        tenantId,
        send: (overrides: Partial<ReviewWebsocketSender.SendParams> = {}): Promise<void> => {
            return sender.send({
                reviewId: "review-1",
                event: EVENT,
                recipientIds: [ANNA, BOB],
                action: ACTION,
                data: DATA,
                ...overrides
            });
        }
    };
};

describe("ReviewWebsocketSender (R255, D149, R188, R197)", () => {
    beforeEach(() => {
        loggedErrors.length = 0;
        tenantFault.mode = "none";
    });

    afterEach(() => {
        tenantFault.mode = "none";
    });

    describe("the frame", () => {
        it("sends one { action, data } frame to the recipient's current-tenant connection", async () => {
            const { send, connections, sends, tenantId } = await setup();
            connections.connect(ANNA, tenantId, "conn-anna");

            await send({ recipientIds: [ANNA] });

            expect(sends.sent).toEqual([
                {
                    connections: [{ connectionId: "conn-anna", endpoint: "wss://websockets.test" }],
                    message: { action: ACTION, data: DATA }
                }
            ]);
            expect(Object.keys(sends.sent[0].message).sort()).toEqual(["action", "data"]);
            expect(connections.calls).toEqual([{ where: { identityId: ANNA } }]);
        });

        it("sends the action and the data it is given, whatever they are", async () => {
            const { send, connections, sends, tenantId } = await setup();
            connections.connect(ANNA, tenantId, "conn-anna");

            await send({
                recipientIds: [ANNA],
                action: "workflows.reviewChanged",
                data: { kind: "requested", reviewId: "review-9", stepId: null }
            });

            expect(sends.sent[0].message).toEqual({
                action: "workflows.reviewChanged",
                data: { kind: "requested", reviewId: "review-9", stepId: null }
            });
        });
    });

    describe("recipients (R188)", () => {
        it("sends only to the recipients, never to other users with connections", async () => {
            const { send, connections, sends, tenantId } = await setup();
            connections
                .connect(ANNA, tenantId, "conn-anna")
                .connect(BOB, tenantId, "conn-bob")
                .connect("user-dan", tenantId, "conn-dan");

            await send({ recipientIds: [ANNA] });

            expect(
                sends.sent.map(frame => frame.connections.map(item => item.connectionId))
            ).toEqual([["conn-anna"]]);
        });

        it("sends one frame per recipient, with every connection of that recipient in the tenant", async () => {
            const { send, connections, sends, tenantId } = await setup();
            connections
                .connect(ANNA, tenantId, "anna-tab-1")
                .connect(ANNA, tenantId, "anna-tab-2")
                .connect(BOB, tenantId, "bob-tab-1");

            await send();

            // Order-independent: batches run concurrently.
            const frames = sends.sent
                .map(frame => frame.connections.map(item => item.connectionId).sort())
                .sort((a, b) => a[0].localeCompare(b[0]));
            expect(frames).toEqual([["anna-tab-1", "anna-tab-2"], ["bob-tab-1"]]);
        });

        it("sends an id listed twice once", async () => {
            const { send, connections, sends, tenantId } = await setup();
            connections.connect(ANNA, tenantId, "conn-anna");

            await send({ recipientIds: [ANNA, ANNA] });

            expect(sends.sent).toHaveLength(1);
            expect(connections.calls).toHaveLength(1);
        });

        it("does nothing at all without recipients, not even a tenant read", async () => {
            const { send, connections, sends } = await setup();
            tenantFault.mode = "throws";

            await expect(send({ recipientIds: [] })).resolves.toBeUndefined();

            expect(connections.calls).toEqual([]);
            expect(sends.sent).toEqual([]);
            expect(loggedErrors).toEqual([]);
        });

        it("makes no list call for an empty or missing id, and logs nothing (R188)", async () => {
            const { send, connections, sends, tenantId } = await setup();
            connections.connect(ANNA, tenantId, "conn-anna");
            tenantFault.mode = "throws";

            await send({ recipientIds: ["", undefined as unknown as string] });

            expect(connections.calls).toEqual([]);
            expect(sends.sent).toEqual([]);
            expect(loggedErrors).toEqual([]);
        });

        it("still sends to the ids it has when others are empty", async () => {
            const { send, connections, sends, tenantId } = await setup();
            connections.connect(ANNA, tenantId, "conn-anna");

            await send({ recipientIds: ["", ANNA] });

            expect(connections.calls).toEqual([{ where: { identityId: ANNA } }]);
            expect(sends.sent).toHaveLength(1);
        });
    });

    describe("tenant (R188, A63, D149)", () => {
        it("sends to the connection of the current tenant only, not to the same user in another tenant", async () => {
            const { send, connections, sends, tenantId } = await setup();
            connections
                .connect(ANNA, "another-tenant", "conn-other-tenant")
                .connect(ANNA, tenantId, "conn-this-tenant");

            await send({ recipientIds: [ANNA] });

            expect(sends.sent).toHaveLength(1);
            expect(sends.sent[0].connections).toEqual([
                { connectionId: "conn-this-tenant", endpoint: "wss://websockets.test" }
            ]);
        });

        it("sends nothing, and logs nothing, to a recipient connected only in another tenant", async () => {
            const { send, connections, sends } = await setup();
            connections.connect(ANNA, "another-tenant", "conn-other-tenant");

            await expect(send({ recipientIds: [ANNA] })).resolves.toBeUndefined();

            expect(connections.calls).toEqual([{ where: { identityId: ANNA } }]);
            expect(sends.sent).toEqual([]);
            expect(loggedErrors).toEqual([]);
        });

        it("sends nothing, and logs nothing, to a recipient with no connection", async () => {
            const { send, sends } = await setup();

            await send({ recipientIds: [ANNA] });

            expect(sends.sent).toEqual([]);
            expect(loggedErrors).toEqual([]);
        });

        it("sends nothing and logs once when there is no current tenant", async () => {
            const { send, connections, sends } = await setup();
            connections.connect(ANNA, "root", "conn-anna");
            tenantFault.mode = "missing";

            await expect(send()).resolves.toBeUndefined();

            expect(connections.calls).toEqual([]);
            expect(sends.sent).toEqual([]);
            expect(loggedErrors).toHaveLength(1);
            expect(loggedErrors[0].message).toBe(WEBSOCKET_TEXT);
            expect(loggedErrors[0].fields).toEqual({ reviewId: "review-1", event: EVENT });
        });

        it("sends nothing and logs once when the tenant read throws", async () => {
            const { send, connections, sends } = await setup();
            connections.connect(ANNA, "root", "conn-anna");
            tenantFault.mode = "throws";

            await expect(send()).resolves.toBeUndefined();

            expect(sends.sent).toEqual([]);
            expect(loggedErrors).toHaveLength(1);
            expect(loggedErrors[0].message).toBe(WEBSOCKET_TEXT);
            expect(loggedErrors[0].fields).toEqual({
                errorName: "Error",
                reviewId: "review-1",
                event: EVENT
            });
        });
    });

    describe("failures never reject (R87, R196)", () => {
        it("a throwing connection list for one recipient is logged once and the others still get their frame", async () => {
            const { send, connections, sends, tenantId } = await setup();
            connections.connect(ANNA, tenantId, "conn-anna").connect(BOB, tenantId, "conn-bob");
            connections.mode = "throw";
            connections.onlyFor = ANNA;
            connections.failureMessage = `The list crashed ${SECRET}.`;

            await expect(send()).resolves.toBeUndefined();

            expect(sends.sent.map(frame => frame.connections[0].connectionId)).toEqual([
                "conn-bob"
            ]);
            expect(loggedErrors).toEqual([
                {
                    message: WEBSOCKET_TEXT,
                    fields: {
                        errorName: "Error",
                        errorMessage: `The list crashed ${SECRET}.`,
                        reviewId: "review-1",
                        event: EVENT,
                        recipientId: ANNA
                    }
                }
            ]);
        });

        it("a failed connection list is logged once per recipient with the error code and name", async () => {
            const { send, connections, sends, tenantId } = await setup();
            connections.connect(ANNA, tenantId, "conn-anna").connect(BOB, tenantId, "conn-bob");
            connections.mode = "fail";

            await expect(send()).resolves.toBeUndefined();

            expect(sends.sent).toEqual([]);
            expect(loggedErrors.map(item => item.message)).toEqual([
                WEBSOCKET_TEXT,
                WEBSOCKET_TEXT
            ]);
            expect(loggedErrors.map(item => item.fields.recipientId)).toEqual([ANNA, BOB]);
            expect(loggedErrors[0].fields).toMatchObject({
                errorCode: "Websocket/Service",
                errorName: "Error",
                reviewId: "review-1",
                event: EVENT
            });
        });

        it("a throwing send for one recipient is logged once and the others still get their frame", async () => {
            const { send, connections, sends, tenantId } = await setup();
            connections.connect(ANNA, tenantId, "conn-anna").connect(BOB, tenantId, "conn-bob");
            sends.mode = "throw";
            sends.onlyFor = "conn-anna";

            await expect(send()).resolves.toBeUndefined();

            expect(sends.sent.map(frame => frame.connections[0].connectionId)).toEqual([
                "conn-anna",
                "conn-bob"
            ]);
            expect(loggedErrors).toHaveLength(1);
            expect(loggedErrors[0].message).toBe(WEBSOCKET_TEXT);
            expect(loggedErrors[0].fields).toMatchObject({ recipientId: ANNA });
        });

        it("a failed send is logged once per recipient", async () => {
            const { send, connections, tenantId, sends } = await setup();
            connections.connect(ANNA, tenantId, "conn-anna");
            sends.mode = "fail";

            await expect(send({ recipientIds: [ANNA] })).resolves.toBeUndefined();

            expect(loggedErrors).toHaveLength(1);
            expect(loggedErrors[0].message).toBe(WEBSOCKET_TEXT);
            expect(loggedErrors[0].fields).toMatchObject({
                errorCode: "Websocket/Service",
                recipientId: ANNA
            });
        });
    });

    describe("fan-out (R197, A65)", () => {
        it("sends 25 frames with at most 10 connection lists and 10 sends in flight", async () => {
            const { send, connections, sends, tenantId } = await setup();
            const recipientIds = Array.from({ length: 25 }, (_, index) => `user-${index}`);
            for (const recipientId of recipientIds) {
                connections.connect(recipientId, tenantId, `conn-${recipientId}`);
            }
            connections.holdMs = 5;
            sends.holdMs = 5;

            await send({ recipientIds });

            expect(sends.sent).toHaveLength(25);
            expect(new Set(sends.sent.map(frame => frame.connections[0].connectionId)).size).toBe(
                25
            );
            expect(connections.maxInFlight).toBe(10);
            expect(sends.maxInFlight).toBe(10);
        });
    });
});
```

Modify `packages/api-workflows/__tests__/notifications/ReviewNotifierService.test.ts` (five hunks).

Hunk 1, the imports. Replace

```ts
import { RecordingWebsocketsSend } from "~tests/__helpers/RecordingWebsocketsSend.js";
```

with

```ts
import { RecordingWebsocketsSend } from "~tests/__helpers/RecordingWebsocketsSend.js";
import { RecordingReviewWebsocketSender } from "~tests/__helpers/RecordingReviewWebsocketSender.js";
```

and replace

```ts
import {
    ReviewNotifierService,
    ReviewNotifierServiceFeature
} from "~/features/notifications/ReviewNotifierService/index.js";
```

with

```ts
import {
    ReviewNotifierService,
    ReviewNotifierServiceFeature
} from "~/features/notifications/ReviewNotifierService/index.js";
import {
    ReviewWebsocketSender,
    ReviewWebsocketSenderFeature
} from "~/features/notifications/ReviewWebsocketSender/index.js";
```

Hunk 2, the setup parameters. Replace

```ts
    recipients?: NotificationRecipientService.Interface;
}
```

with

```ts
    recipients?: NotificationRecipientService.Interface;
    sender?: ReviewWebsocketSender.Interface;
}
```

Hunk 3, the one setup line of R255. Replace

```ts
            ReviewTargetLinkServiceFeature.register(container);
            ReviewNotifierServiceFeature.register(container);
```

with

```ts
            ReviewTargetLinkServiceFeature.register(container);
            ReviewWebsocketSenderFeature.register(container);
            ReviewNotifierServiceFeature.register(container);
```

Hunk 4, the optional recording sender. Replace

```ts
            if (params.link) {
                container.registerInstance(ReviewTargetLinkService, params.link);
            }
```

with

```ts
            if (params.link) {
                container.registerInstance(ReviewTargetLinkService, params.link);
            }
            if (params.sender) {
                container.registerInstance(ReviewWebsocketSender, params.sender);
            }
```

Hunk 5, the new cases. Replace the line

```ts
    describe("transports (R186, R192, R194, R195)", () => {
```

with

```ts
    describe("the websocket frame goes through the sender (R255)", () => {
        it("hands the sender the unique recipient ids, the event, the notification action and the R187 data, once", async () => {
            const sender = new RecordingReviewWebsocketSender();
            const { notify } = await setup({ sender });

            await notify({ stepId: "plain", recipients: [ANNA, BOB, ANNA] });

            expect(sender.calls).toEqual([
                {
                    reviewId: "review-1",
                    event: "approved",
                    recipientIds: ["user-anna", "user-bob"],
                    action: WORKFLOWS_NOTIFICATION_WEBSOCKET_ACTION,
                    data: {
                        event: "approved",
                        reviewId: "review-1",
                        stepId: "plain",
                        namespace: "cms.article",
                        targetId: "article-1",
                        targetRevisionId: "article-1#0001",
                        title: MESSAGE.title,
                        body: MESSAGE.body
                    }
                }
            ]);
        });

        it("does not call the sender without recipients", async () => {
            const sender = new RecordingReviewWebsocketSender();
            const { notify } = await setup({ sender });

            await notify({ recipients: [] });

            expect(sender.calls).toEqual([]);
        });

        it("survives a sender that rejects: logs it once with code and name only and still runs the transports", async () => {
            const sender = new RecordingReviewWebsocketSender();
            sender.mode = "throw";
            const { notify, chatB } = await setup({ sender });

            await expect(notify({ stepId: "editorial", recipients: [ANNA] })).resolves.toBeUndefined();

            expect(loggedErrors.filter(item => item.message === WEBSOCKET_TEXT)).toEqual([
                {
                    message: WEBSOCKET_TEXT,
                    fields: { errorName: "Error", reviewId: "review-1", event: "approved" }
                }
            ]);
            expect(chatB.sent).toHaveLength(1);
        });
    });

    describe("transports (R186, R192, R194, R195)", () => {
```

Modify `packages/api-workflows/__tests__/notifications/ReviewNotificationsFeature.test.ts` (three hunks). Replace

```ts
import { ReviewTargetLinkService } from "~/features/notifications/ReviewTargetLinkService/index.js";
```

with

```ts
import { ReviewTargetLinkService } from "~/features/notifications/ReviewTargetLinkService/index.js";
import { ReviewWebsocketSender } from "~/features/notifications/ReviewWebsocketSender/index.js";
```

Replace

```ts
        expect(container.resolveAll(ReviewNotifierService)).toHaveLength(1);
```

with

```ts
        expect(container.resolveAll(ReviewNotifierService)).toHaveLength(1);
        expect(container.resolveAll(ReviewWebsocketSender)).toHaveLength(1);
```

Replace

```ts
        expect(context.container.resolveAll(ReviewNotifierService)).toHaveLength(0);
```

with

```ts
        expect(context.container.resolveAll(ReviewNotifierService)).toHaveLength(0);
        expect(context.container.resolveAll(ReviewWebsocketSender)).toHaveLength(0);
```

The new notifier tests use `WORKFLOWS_NOTIFICATION_WEBSOCKET_ACTION`, which the file already imports.

- [ ] **Step 2: Run the tests to see them fail**

Run each file on its own:
`yarn test packages/api-workflows/__tests__/notifications/ReviewWebsocketSender.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/notifications/ReviewNotifierService.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/notifications/ReviewNotificationsFeature.test.ts 2>&1 | tail -50`
Expected: FAIL for each (`~/features/notifications/ReviewWebsocketSender/index.js` does not exist, so the imports cannot be resolved).

- [ ] **Step 3: Implement**

Create `packages/api-workflows/src/features/notifications/ReviewWebsocketSender/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";

export interface ReviewWebsocketSendParams {
    /** The review the frame is about: a log field only. */
    reviewId: string;
    /** A name for the frame (a notification event or a change kind): a log field only. */
    event: string;
    /** Duplicates and empty ids are dropped; no id left means nothing is sent. */
    recipientIds: string[];
    /** The websocket action of the frame. */
    action: string;
    /** The `data` of the frame, the same for every recipient. */
    data: object;
}

export interface IReviewWebsocketSender {
    /**
     * Sends one `{ action, data }` frame to every connection of every recipient in the current
     * tenant (D149, R188, A63). Recipients are handled in batches of
     * `NOTIFICATION_SEND_CONCURRENCY` (R197). Never rejects and never reports a failure (R87,
     * R196): every failure is logged once and the rest still goes out.
     */
    send(params: ReviewWebsocketSendParams): Promise<void>;
}

/** Sends one review websocket frame. Internal (D132): no permission check. */
export const ReviewWebsocketSender = createAbstraction<IReviewWebsocketSender>(
    "Workflows/ReviewWebsocketSender"
);

export namespace ReviewWebsocketSender {
    export type Interface = IReviewWebsocketSender;
    export type SendParams = ReviewWebsocketSendParams;
}
```

Create `packages/api-workflows/src/features/notifications/ReviewWebsocketSender/ReviewWebsocketSender.ts`:

```ts
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import {
    WebsocketsListConnectionsUseCase,
    WebsocketsSendToConnectionsUseCase
} from "@webiny/api-websockets/exports/api.js";
import { NOTIFICATION_SEND_CONCURRENCY } from "~/domain/notifications/constants.js";
import { getErrorLogFields } from "~/domain/notifications/getErrorLogFields.js";
import { ReviewWebsocketSender as Abstraction } from "./abstractions.js";

const WEBSOCKET_TEXT = "Could not send a workflow websocket notification.";

class ReviewWebsocketSenderImpl implements Abstraction.Interface {
    public constructor(
        private listConnections: WebsocketsListConnectionsUseCase.Interface,
        private sendToConnections: WebsocketsSendToConnectionsUseCase.Interface,
        private tenantContext: TenantContext.Interface,
        private logger: Logger.Interface
    ) {}

    public async send(params: Abstraction.SendParams): Promise<void> {
        const { reviewId, event, action, data } = params;

        // One entry per id. An empty or missing id never reaches the list use case:
        // `identityId: ""` would list every connection.
        const uniqueIds = [...new Set(params.recipientIds)];
        const recipientIds = uniqueIds.filter(id => typeof id === "string" && id !== "");
        if (recipientIds.length === 0) {
            return;
        }

        let tenantId: string | undefined;
        let tenantError: unknown;
        try {
            tenantId = this.tenantContext.getTenant()?.id;
        } catch (error) {
            tenantError = error;
        }

        if (typeof tenantId !== "string" || tenantId === "") {
            // No current tenant: nothing is sent (a frame must never leave the review's tenant),
            // and the failure is logged once for all recipients.
            this.logger.error(
                { ...getErrorLogFields(tenantError), reviewId, event },
                WEBSOCKET_TEXT
            );
            return;
        }

        const currentTenantId = tenantId;
        for (let start = 0; start < recipientIds.length; start += NOTIFICATION_SEND_CONCURRENCY) {
            const batch = recipientIds.slice(start, start + NOTIFICATION_SEND_CONCURRENCY);
            await Promise.all(
                batch.map(async recipientId => {
                    try {
                        const listed = await this.listConnections.execute({
                            where: { identityId: recipientId }
                        });
                        if (listed.isFail()) {
                            this.logger.error(
                                {
                                    ...getErrorLogFields(listed.error),
                                    errorMessage: listed.error.message,
                                    reviewId,
                                    event,
                                    recipientId
                                },
                                WEBSOCKET_TEXT
                            );
                            return;
                        }

                        // The same user can be connected in other tenants (A63).
                        const connections = listed.value
                            .filter(connection => connection.tenant === currentTenantId)
                            .map(connection => ({
                                connectionId: connection.connectionId,
                                endpoint: connection.endpoint
                            }));
                        if (connections.length === 0) {
                            return;
                        }

                        const sent = await this.sendToConnections.execute(connections, {
                            action,
                            data
                        });
                        if (sent.isFail()) {
                            this.logger.error(
                                {
                                    ...getErrorLogFields(sent.error),
                                    errorMessage: sent.error.message,
                                    reviewId,
                                    event,
                                    recipientId
                                },
                                WEBSOCKET_TEXT
                            );
                        }
                    } catch (error) {
                        this.logger.error(
                            {
                                ...getErrorLogFields(error),
                                errorMessage: error instanceof Error ? error.message : undefined,
                                reviewId,
                                event,
                                recipientId
                            },
                            WEBSOCKET_TEXT
                        );
                    }
                })
            );
        }
    }
}

export const ReviewWebsocketSender = Abstraction.createImplementation({
    implementation: ReviewWebsocketSenderImpl,
    dependencies: [
        WebsocketsListConnectionsUseCase,
        WebsocketsSendToConnectionsUseCase,
        TenantContext,
        Logger
    ]
});
```

Create `packages/api-workflows/src/features/notifications/ReviewWebsocketSender/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { ReviewWebsocketSender } from "./ReviewWebsocketSender.js";

export const ReviewWebsocketSenderFeature = createFeature({
    name: "WorkflowNotifications/ReviewWebsocketSender",
    register(container) {
        container.register(ReviewWebsocketSender);
    }
});
```

Create `packages/api-workflows/src/features/notifications/ReviewWebsocketSender/index.ts`:

```ts
export { ReviewWebsocketSenderFeature } from "./feature.js";
export { ReviewWebsocketSender } from "./abstractions.js";
```

Replace the whole of `packages/api-workflows/src/features/notifications/ReviewNotifierService/ReviewNotifierService.ts` with the following (the websocket section now calls the sender; the transport section and the registration are the existing code, character for character, apart from the dependency list):

```ts
import type { NonEmptyArray } from "@webiny/api/types.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { WORKFLOWS_NOTIFICATION_WEBSOCKET_ACTION } from "~/domain/notifications/constants.js";
import { getErrorLogFields } from "~/domain/notifications/getErrorLogFields.js";
import type { WorkflowNotificationWebsocketData } from "~/domain/notifications/types.js";
import { NotificationTransport } from "~/features/notifications/NotificationTransport/abstractions.js";
import { NotificationRecipientService } from "~/features/notifications/NotificationRecipientService/abstractions.js";
import { ReviewTargetLinkService } from "~/features/notifications/ReviewTargetLinkService/abstractions.js";
import { ReviewWebsocketSender } from "~/features/notifications/ReviewWebsocketSender/abstractions.js";
import { ReviewNotifierService as Abstraction } from "./abstractions.js";

const WEBSOCKET_TEXT = "Could not send a workflow websocket notification.";
const LOOKUP_TEXT = "Could not look up the users to e-mail.";
const TRANSPORT_TEXT = "Could not send a workflow notification through a transport.";
const UNKNOWN_TRANSPORT_TEXT = "A step names a notification transport that is not registered.";

class ReviewNotifierServiceImpl implements Abstraction.Interface {
    public constructor(
        private websocketSender: ReviewWebsocketSender.Interface,
        private transports: NotificationTransport.Interface[],
        private recipientService: NotificationRecipientService.Interface,
        private linkService: ReviewTargetLinkService.Interface,
        private logger: Logger.Interface
    ) {}

    public async notify(params: Abstraction.Params): Promise<void> {
        const { review, stepId, event, message } = params;

        // One entry per id, the first wins (a pool list cannot hold a person twice, but a custom
        // handler might).
        const recipients = [...new Map(params.recipients.map(item => [item.id, item])).values()];
        if (recipients.length === 0) {
            return;
        }

        // ---- Websocket (R187, R188, R197, R255) ------------------------------------------------
        // The sender removes duplicate and empty ids (`identityId: ""` would list every
        // connection), keeps to the connections of the current tenant, sends in batches and
        // never rejects.
        const data: WorkflowNotificationWebsocketData = {
            event,
            reviewId: review.id,
            stepId,
            namespace: review.model,
            targetId: review.targetId,
            targetRevisionId: review.targetRevisionId,
            title: message.title,
            body: message.body
        };
        const recipientIds = recipients.map(item => item.id);
        // The sender never rejects; this catch only guards a decorator that does (R87), so the
        // transports below still run.
        try {
            await this.websocketSender.send({
                reviewId: review.id,
                event,
                recipientIds,
                action: WORKFLOWS_NOTIFICATION_WEBSOCKET_ACTION,
                data
            });
        } catch (error) {
            this.logger.error(
                { ...getErrorLogFields(error), reviewId: review.id, event },
                WEBSOCKET_TEXT
            );
        }

        // ---- Transports (R186, R192, R193, R194, R195) -----------------------------------------
        try {
            const step =
                stepId === null ? undefined : review.steps.find(item => item.id === stepId);
            if (!step || (step.notifications ?? []).length === 0) {
                return;
            }

            // The last registered transport per id wins (override semantics, so the Map keeps the last
            // one); ids are visited in the step's own order, one call per id.
            const registered = new Map(this.transports.map(item => [item.id, item]));
            const selected: NotificationTransport.Interface[] = [];
            for (const transportId of new Set((step.notifications ?? []).map(item => item.id))) {
                const transport = registered.get(transportId);
                if (!transport) {
                    this.logger.error(
                        { reviewId: review.id, stepId: step.id, transportId },
                        UNKNOWN_TRANSPORT_TEXT
                    );
                    continue;
                }
                selected.push(transport);
            }
            if (selected.length === 0) {
                return;
            }

            // The recipient service wraps every lookup error: the message may embed addresses, so
            // only the code and the name are logged (R196).
            let found: Awaited<NotificationRecipientService.UsersReturn>;
            try {
                found = await this.recipientService.listUsers(recipients.map(item => item.id));
            } catch (error) {
                this.logger.error(
                    { ...getErrorLogFields(error), reviewId: review.id, event },
                    LOOKUP_TEXT
                );
                return;
            }
            if (found.isFail()) {
                this.logger.error(
                    { ...getErrorLogFields(found.error), reviewId: review.id, event },
                    LOOKUP_TEXT
                );
                return;
            }
            const [firstUser, ...otherUsers] = found.value;
            if (!firstUser) {
                return;
            }
            const users: NonEmptyArray<NotificationTransport.User> = [firstUser, ...otherUsers];

            // `null` means the mail goes without a link. The link service logs its own problems.
            const url = await this.linkService.getUrl({
                model: review.model,
                targetId: review.targetId,
                targetRevisionId: review.targetRevisionId
            });
            const transportMessage: NotificationTransport.Message = {
                title: message.subject,
                body: message.text,
                url,
                linkLabel: message.linkLabel
            };

            for (const transport of selected) {
                try {
                    await transport.send({ users, message: transportMessage });
                } catch (error) {
                    // A third-party transport may put anything in its message: code and name only.
                    this.logger.error(
                        {
                            ...getErrorLogFields(error),
                            transportId: transport.id,
                            reviewId: review.id,
                            event
                        },
                        TRANSPORT_TEXT
                    );
                }
            }
        } catch (error) {
            this.logger.error(
                { ...getErrorLogFields(error), reviewId: review.id, event },
                TRANSPORT_TEXT
            );
        }
    }
}

export const ReviewNotifierService = Abstraction.createImplementation({
    implementation: ReviewNotifierServiceImpl,
    dependencies: [
        ReviewWebsocketSender,
        [NotificationTransport, { multiple: true }],
        NotificationRecipientService,
        ReviewTargetLinkService,
        Logger
    ]
});
```

Modify `packages/api-workflows/src/features/notifications/feature.ts` (two hunks). Replace

```ts
import { ReviewNotifierServiceFeature } from "~/features/notifications/ReviewNotifierService/index.js";
```

with

```ts
import { ReviewNotifierServiceFeature } from "~/features/notifications/ReviewNotifierService/index.js";
import { ReviewWebsocketSenderFeature } from "~/features/notifications/ReviewWebsocketSender/index.js";
```

and replace

```ts
        ReviewTargetLinkServiceFeature.register(container);
        ReviewNotifierServiceFeature.register(container);
```

with

```ts
        ReviewTargetLinkServiceFeature.register(container);
        ReviewWebsocketSenderFeature.register(container);
        ReviewNotifierServiceFeature.register(container);
```

- [ ] **Step 4: Run the tests to see them pass**

Run each file on its own:
`yarn test packages/api-workflows/__tests__/notifications/ReviewWebsocketSender.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/notifications/ReviewNotifierService.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/notifications/ReviewNotificationsFeature.test.ts 2>&1 | tail -50`
Expected: PASS for each.

Run the same three with `yarn test:os` (one at a time).
Expected: PASS.

- [ ] **Step 5: Run the existing tests covering the changed code**

The sender now sits under every notification frame, so run the two end-to-end files unchanged, each with `yarn test` and then `yarn test:os`:
`yarn test packages/api-workflows/__tests__/notifications/ReviewNotifications.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/notifications/ReviewNotificationsBackgroundTask.test.ts 2>&1 | tail -50`
Expected: PASS without editing either file (their frame, tenant, fan-out and failure assertions now run through the sender).

Run the handler tests, which register a recording notifier and so do not touch the sender, once as a guard:
`yarn test packages/api-workflows/__tests__/notifications/ReviewStepFailedNotifications.test.ts 2>&1 | tail -50`
Expected: PASS.

Run: `yarn check:test:types -p api-workflows --report cli 2>&1 | tail -40`
Expected: no errors in the touched package. (If a new test reports that `undefined as unknown as string` or the `Partial<ReviewWebsocketSender.SendParams>` spread does not type-check, keep the test's intent and fix the annotation, not the source.)

- [ ] **Step 6: Pre-commit chain and commit**

Run the Global Constraints pre-commit chain from the 8a `00-shared.md` in full (`git add .`, `yarn > /dev/null 2>&1`, `node scripts/generateTsConfigsInPackages.js`, `yarn adio`, `yarn check-ts-configs`, `yarn format:fix > /dev/null 2>&1`, `yarn lint:fix`, `yarn webiny sync-dependencies`, `yarn build -p @webiny/api-workflows --no-cache 2>&1 | tail -30`, `git add .`), and restore `.gitleaks.toml` (`git checkout -- .gitleaks.toml`, and `git restore --staged .gitleaks.toml` if the chain staged it). If any step fails and you fix something, rerun the chain from the start. Then commit:

```
git commit -m "refactor(api-workflows): move the websocket send loop into ReviewWebsocketSender" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

**Contract notes:**
- The contract writes `ReviewWebsocketSenderFeature` with the string `"Workflows/ReviewWebsocketSender"`. That string is the abstraction token (kept exactly). The feature's own name follows the sibling folders (`"WorkflowNotifications/ReviewNotifierService"`, so `"WorkflowNotifications/ReviewWebsocketSender"`).
- The contract's file list changes `ReviewNotifierService.test.ts` by "one setup line". This task adds that line (hunk 3) and, besides, one optional `sender` setup parameter and three cases that pin the hand-over to the sender and a rejecting sender (hunks 2, 4, 5). The existing assertions are untouched.
- `data: object` (contract) is kept. `WebsocketsSendToConnectionsUseCase.execute` types its data as `T extends GenericRecord`; a TypeScript check with `strict` shows that an `object` and an interface are both assignable to it, so no cast is needed.
