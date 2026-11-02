### Task 10: `@webiny/api-websockets` dependency, test helpers, `ReviewNotifierService`

Spec 12; D44, D60, D96, D103, D132; R186, R187, R188, R192, R193, R194, R195, R196, R197, R200; A63, A65, A67; Review Focus 1, 3, 4, 8, 9. The one DI service that turns "these people, this message, this step" into a websocket frame per recipient and one transport call per channel of the step. Handlers (Tasks 11-12) call it; it never rejects and never returns a failure, so a broken mailer, websocket, lookup or link can never fail or roll back a review action that is already saved (the saver publishes after the save and lets handler exceptions propagate).

`ReviewNotifierService.notify(params)` does this, in order:

1. **Recipients.** `params.recipients` is deduplicated by `id` (first wins). No recipients: return, nothing called.
2. **Websocket (R187, R188, R197).** Only recipients whose `id` is a non-empty string are used (an empty id must never reach `WebsocketsListConnectionsUseCase`: `where: { identityId: "" }` lists every connection). When there is at least one, the current tenant id is read once (`TenantContext.getTenant()?.id`, inside a try/catch): when it is missing, empty or the read throws, nothing is sent and one `Logger.error({ errorCode, errorName, reviewId, event }, "Could not send a workflow websocket notification.")` is logged (no `recipientId` field, because it is about all recipients). Otherwise the recipients go in plain batches of `NOTIFICATION_SEND_CONCURRENCY` (10, `Promise.all` per batch, the next batch starts when the previous one is done). Per recipient, in its own try/catch: `WebsocketsListConnectionsUseCase.execute({ where: { identityId: recipient.id } })`, keep the rows whose `tenant` equals the current tenant id, map them to `{ connectionId, endpoint }`, and when at least one is left call `WebsocketsSendToConnectionsUseCase.execute(connections, { action: WORKFLOWS_NOTIFICATION_WEBSOCKET_ACTION, data })` once. `data` is exactly the R187 `WorkflowNotificationWebsocketData` (`event`, `reviewId`, `stepId`, `namespace` = `review.model`, `targetId`, `targetRevisionId`, `title` and `body` of the message), nothing else, no `messageId`, no `error`. A recipient with no connection, or connected only in another tenant, gets nothing and no log. A failed Result or a throw for one recipient is logged once (`"Could not send a workflow websocket notification."` with `errorCode`, `errorName`, `errorMessage`, `reviewId`, `event`, `recipientId`: a websocket transport error message holds connection data, never an address, R196) and the other recipients still go out. Nothing is retried.
3. **Transports (R186, R192, R193, R194, R195).** Only when `params.stepId` names a step of `params.review` that lists at least one registered transport. The transports are mapped by id (`Map`, last registration wins); the step's `notifications` ids are deduplicated in the step's own order; an id with no registered transport is skipped and logged once: `Logger.error({ reviewId, stepId, transportId }, "A step names a notification transport that is not registered.")`. With no usable transport left: stop, no lookup, no link. Otherwise one `NotificationRecipientService.listUsers(recipientIds)` (a failed Result or a throw is logged once with `errorCode` and `errorName` only, never `error.message`, which may embed addresses: `"Could not look up the users to e-mail."`; the websocket was already sent; the transports are skipped), no users found: stop, one `ReviewTargetLinkService.getUrl({ model, targetId, targetRevisionId })` (`null` means the mail goes without a link; the link service logs its own problems, the notifier never logs a link problem itself), then one `transport.send({ users, message: { title: message.subject, body: message.text, url, linkLabel: message.linkLabel } })` per transport, each in its own try/catch (`"Could not send a workflow notification through a transport."` with `transportId`, `errorCode`, `errorName`, `reviewId`, `event`; never `error.message`, a third-party transport may put anything there). An unexpected throw in this phase (for example the link service itself rejecting) is caught by one outer try/catch with the same text. The transports are the last thing that runs; a failure in any of them never touches the websocket that already went out.

No message ever contains an error text (R146 mirror); the notifier only passes `params.message` through.

**Test helpers (reused by Tasks 11-13).** `RecordingMailer` (the e-mail transport test's local fake, moved; Task 3's test is switched to it here), `FakeWebsocketConnections`, `RecordingWebsocketsSend`, `RecordingNotificationTransport`, `FakeWorkflowsAdminUrl`, `FakeReviewTargetLink` and `FakeWebsocketFailure`. The "no current tenant" and "throwing tenant read" cases reuse Task 8's `FaultyTenantContext` (`registerFaultyTenantContext`, `tenantFault`). Nothing here sends a mail or a frame.

**Files:**
- Modify: `packages/api-workflows/package.json` (dependency `@webiny/api-websockets`)
- Create: `packages/api-workflows/src/domain/notifications/getErrorLogFields.ts`
- Create: `packages/api-workflows/src/features/notifications/ReviewNotifierService/abstractions.ts`
- Create: `packages/api-workflows/src/features/notifications/ReviewNotifierService/ReviewNotifierService.ts`
- Create: `packages/api-workflows/src/features/notifications/ReviewNotifierService/feature.ts`
- Create: `packages/api-workflows/src/features/notifications/ReviewNotifierService/index.ts`
- Create: `packages/api-workflows/__tests__/__helpers/RecordingMailer.ts`
- Create: `packages/api-workflows/__tests__/__helpers/FakeWebsocketFailure.ts`
- Create: `packages/api-workflows/__tests__/__helpers/FakeWebsocketConnections.ts`
- Create: `packages/api-workflows/__tests__/__helpers/RecordingWebsocketsSend.ts`
- Create: `packages/api-workflows/__tests__/__helpers/RecordingNotificationTransport.ts`
- Create: `packages/api-workflows/__tests__/__helpers/FakeWorkflowsAdminUrl.ts`
- Create: `packages/api-workflows/__tests__/__helpers/FakeReviewTargetLink.ts`
- Modify: `packages/api-workflows/__tests__/notifications/MailNotificationTransport.test.ts` (use the shared `RecordingMailer`)
- Create: `packages/api-workflows/__tests__/notifications/getErrorLogFields.test.ts`
- Create: `packages/api-workflows/__tests__/notifications/ReviewNotifierService.test.ts`

**Interfaces:**
- Consumes:
  - Task 1: `NotificationTransport` and its namespace types `Interface`, `User { id; email; displayName }`, `Message { title; body; url: string | null; linkLabel }`, `SendParams` (`~/features/notifications/NotificationTransport/index.js`); the `NotificationTransportFeature` that registers the e-mail transport (id `"e-mail"`) in every test context.
  - Task 3: `MailNotificationTransport` (the real e-mail transport; its test file `MailNotificationTransport.test.ts` has a local `FakeMailer` that this task replaces).
  - Task 6: `WORKFLOWS_NOTIFICATION_WEBSOCKET_ACTION`, `NOTIFICATION_SEND_CONCURRENCY` (`~/domain/notifications/constants.js`), `NotificationMessage`, `WorkflowNotificationEvent`, `WorkflowNotificationWebsocketData` (`~/domain/notifications/types.js`).
  - Task 7: `NotificationRecipientService` (`listUsers(ids)`), `NotificationRecipient`, `NotificationRecipientServiceFeature` (`~/features/notifications/NotificationRecipientService/index.js`).
  - Task 8: `ReviewTargetLinkService` (`getUrl(params): Promise<string | null>`), `ReviewTargetLinkServiceFeature` (`~/features/notifications/ReviewTargetLinkService/index.js`), `ReviewTargetLink` and its namespace `Interface`, `Params` (`~/features/notifications/ReviewTargetLink/index.js`), `WorkflowsAdminUrlService` (`get(): Promise<string | null>`, `~/features/notifications/WorkflowsAdminUrlService/index.js`), `registerFaultyTenantContext`, `tenantFault` (`~tests/__helpers/FaultyTenantContext.js`).
  - Existing: `Logger` (`@webiny/api-core/features/logger/index.js`), `TenantContext` (`@webiny/api-core/features/tenancy/TenantContext/index.js`; `getTenant()`, `withTenant`), `ListUsersUseCase` (`@webiny/api-core/features/users/ListUsers/index.js`), `MailerService` (`@webiny/api-mailer`), `WebsocketsListConnectionsUseCase` (`execute({ where: { identityId } })`, `ConnectionRegistry.Data { connectionId; identity; tenant; connectedOn; endpoint }` as `WebsocketsListConnectionsUseCase.RegistryData`) and `WebsocketsSendToConnectionsUseCase` (`execute(connections: { connectionId; endpoint }[], { action, data })`), both from `@webiny/api-websockets/exports/api.js` (plus the type `WebsocketsError`), `NonEmptyArray` (`@webiny/api/types.js`), `ReviewData` (`~/domain/review/types.js`), `WorkflowPersistenceError`.
  - Test helpers: `createContextHandler` (`~tests/__helpers/handler.js`), `captureLoggedErrors`, `loggedErrors` (`~tests/__helpers/CapturingLogger.js`), `FakeListUsers`, `FakeUser` (`~tests/__helpers/FakeListUsers.js`; `failuresLeft`, `calls`), `createStartedReview`, `createWorkflow`, `createReviewStep` (`~tests/__helpers/fixtures.js`).
- Produces (matches the contract):
  - `ReviewNotifyParams { review: ReviewData; stepId: string | null; event: WorkflowNotificationEvent; recipients: NotificationRecipient[]; message: NotificationMessage }`, `IReviewNotifierService { notify(params): Promise<void> }`, `ReviewNotifierService = createAbstraction<IReviewNotifierService>("ReviewNotifierService")` with the namespace `Interface` and `Params`; the implementation `ReviewNotifierService` (dependencies `[WebsocketsListConnectionsUseCase, WebsocketsSendToConnectionsUseCase, TenantContext, [NotificationTransport, { multiple: true }], NotificationRecipientService, ReviewTargetLinkService, Logger]`) and `ReviewNotifierServiceFeature`. `ReviewNotificationsFeature` (Task 12) registers the feature; until then the tests register it in `setup`. Consumed by Tasks 11-13.
  - `getErrorLogFields(error: unknown): ErrorLogFields` (`~/domain/notifications/getErrorLogFields.js`, pure, internal): `errorCode` and `errorName` only when they are strings, else `undefined`. Used by the notifier and the handlers (Tasks 11-12).
  - Test helpers (`~tests/__helpers/...`): `RecordingMailer` (`sent`, `failOn`, `throwOn`, `failureMessage`) and the type `SentMail`; `FakeWebsocketConnections` (`connect(identityId, tenant, connectionId?)`, `calls`, `mode`, `onlyFor`, `failureMessage`, `holdMs`, `inFlight`, `maxInFlight`); `RecordingWebsocketsSend` (`sent: SentFrame[]`, `mode`, `onlyFor`, `failureMessage`, `holdMs`, `maxInFlight`); `RecordingNotificationTransport` (`id`, `sent`, `mode`, `failureMessage`); `FakeWorkflowsAdminUrl` (`url`, `mode`, `calls`); `FakeReviewTargetLink` (`paths`); `FakeWebsocketFailure`.

- [ ] **Step 1: Write the failing tests**

Create `packages/api-workflows/__tests__/__helpers/RecordingMailer.ts` (the fake of `MailNotificationTransport.test.ts`, moved so Tasks 10 and 13 share it):

```ts
import { BaseError, Result } from "@webiny/feature/api";
import type { MailerService } from "@webiny/api-mailer";

export type SentMail = Parameters<MailerService.Interface["sendMail"]>[0];

class SmtpFailure extends BaseError {
    override readonly code = "Mailer/MailerService/TransportSendError" as const;

    public constructor(message: string) {
        super({ message });
    }
}

/**
 * Records every mail instead of sending it. `failOn` makes the calls with those indexes return a
 * failed Result, `throwOn` makes them throw (an error that carries a `code`), both by call index.
 * Register with `container.registerInstance(MailerService, mailer)`.
 */
export class RecordingMailer implements MailerService.Interface {
    public readonly sent: SentMail[] = [];
    public failOn: number[] = [];
    public throwOn: number[] = [];
    public failureMessage = "SMTP refused.";

    public async sendMail<T = any>(data: SentMail): MailerService.Return<T> {
        const index = this.sent.length;
        this.sent.push(data);
        if (this.throwOn.includes(index)) {
            throw Object.assign(new Error(this.failureMessage), { code: "ECONNRESET" });
        }
        if (this.failOn.includes(index)) {
            return Result.fail(new SmtpFailure(this.failureMessage) as never);
        }
        return Result.ok({ result: null, error: null });
    }
}
```

Create `packages/api-workflows/__tests__/__helpers/FakeWebsocketFailure.ts`:

```ts
import { BaseError } from "@webiny/feature/api";

/** The error a failed websocket Result carries (`WebsocketServiceError` has the same code). */
export class FakeWebsocketFailure extends BaseError {
    override readonly code = "Websocket/Service" as const;

    public constructor(message: string) {
        super({ message });
    }
}
```

Create `packages/api-workflows/__tests__/__helpers/FakeWebsocketConnections.ts`:

```ts
import { Result } from "@webiny/feature/api";
import {
    WebsocketsListConnectionsUseCase,
    type WebsocketsError
} from "@webiny/api-websockets/exports/api.js";
import { FakeWebsocketFailure } from "./FakeWebsocketFailure.js";

export type WebsocketFakeMode = "ok" | "fail" | "throw";

/**
 * `WebsocketsListConnectionsUseCase` over a fixed set of connections, listed per identity like the
 * real one (no identity: every connection, the way `where: { identityId: "" }` would behave, so a
 * test can prove the notifier never asks). Records every call. `mode` makes the calls fail or
 * throw (all of them, or only the ones for `onlyFor`); `holdMs` keeps a call in flight so a test
 * can measure concurrency. Register with
 * `container.registerInstance(WebsocketsListConnectionsUseCase, fake)`.
 */
export class FakeWebsocketConnections implements WebsocketsListConnectionsUseCase.Interface {
    public readonly calls: WebsocketsListConnectionsUseCase.Params[] = [];
    public mode: WebsocketFakeMode = "ok";
    /** When set, `mode` applies only to the listing of this identity id. */
    public onlyFor: string | null = null;
    public failureMessage = "The connection list failed.";
    public holdMs = 0;
    public inFlight = 0;
    public maxInFlight = 0;
    private readonly rows = new Map<string, WebsocketsListConnectionsUseCase.RegistryData[]>();

    /** Adds one live connection of `identityId` in `tenant`. */
    public connect(
        identityId: string,
        tenant: string,
        connectionId = `${identityId}:${tenant}`
    ): this {
        const rows = this.rows.get(identityId) ?? [];
        rows.push({
            connectionId,
            identity: { id: identityId, displayName: identityId, type: "admin" },
            tenant,
            connectedOn: new Date().toISOString(),
            endpoint: "wss://websockets.test"
        });
        this.rows.set(identityId, rows);
        return this;
    }

    public async execute(
        params?: WebsocketsListConnectionsUseCase.Params
    ): Promise<Result<WebsocketsListConnectionsUseCase.RegistryData[], WebsocketsError>> {
        this.calls.push(structuredClone(params ?? {}));
        this.inFlight += 1;
        this.maxInFlight = Math.max(this.maxInFlight, this.inFlight);
        try {
            if (this.holdMs > 0) {
                await new Promise<void>(resolve => setTimeout(resolve, this.holdMs));
            }
            const identityId = params?.where?.identityId;
            const applies = this.onlyFor === null || this.onlyFor === identityId;
            if (applies && this.mode === "throw") {
                throw new Error(this.failureMessage);
            }
            if (applies && this.mode === "fail") {
                return Result.fail(new FakeWebsocketFailure(this.failureMessage) as never);
            }
            const rows = identityId
                ? (this.rows.get(identityId) ?? [])
                : [...this.rows.values()].flat();
            return Result.ok(rows.map(row => ({ ...row, identity: { ...row.identity } })));
        } finally {
            this.inFlight -= 1;
        }
    }
}
```

Create `packages/api-workflows/__tests__/__helpers/RecordingWebsocketsSend.ts`:

```ts
import { Result } from "@webiny/feature/api";
import type { GenericRecord } from "@webiny/api/types.js";
import {
    WebsocketsSendToConnectionsUseCase,
    type WebsocketsError
} from "@webiny/api-websockets/exports/api.js";
import { FakeWebsocketFailure } from "./FakeWebsocketFailure.js";
import type { WebsocketFakeMode } from "./FakeWebsocketConnections.js";

/** One `execute` call: the connections it was given and the whole `{ action, data }` message. */
export interface SentFrame {
    connections: WebsocketsSendToConnectionsUseCase.Connection[];
    message: WebsocketsSendToConnectionsUseCase.Data<GenericRecord>;
}

/**
 * `WebsocketsSendToConnectionsUseCase` that records every call instead of sending a frame (a
 * failing or throwing call is recorded too). `mode` makes the calls fail or throw (all, or only
 * the ones whose first connection id is `onlyFor`); `holdMs` keeps a call in flight so a test can
 * measure concurrency. Register with
 * `container.registerInstance(WebsocketsSendToConnectionsUseCase, fake)`.
 */
export class RecordingWebsocketsSend implements WebsocketsSendToConnectionsUseCase.Interface {
    public readonly sent: SentFrame[] = [];
    public mode: WebsocketFakeMode = "ok";
    /** When set, `mode` applies only to the sends whose first connection id is this one. */
    public onlyFor: string | null = null;
    public failureMessage = "The websocket send failed.";
    public holdMs = 0;
    public inFlight = 0;
    public maxInFlight = 0;

    public async execute<T extends GenericRecord = GenericRecord>(
        connections: WebsocketsSendToConnectionsUseCase.Connection[],
        data: WebsocketsSendToConnectionsUseCase.Data<T>
    ): Promise<Result<void, WebsocketsError>> {
        this.sent.push({
            connections: structuredClone(connections),
            message: structuredClone(data) as WebsocketsSendToConnectionsUseCase.Data<GenericRecord>
        });
        this.inFlight += 1;
        this.maxInFlight = Math.max(this.maxInFlight, this.inFlight);
        try {
            if (this.holdMs > 0) {
                await new Promise<void>(resolve => setTimeout(resolve, this.holdMs));
            }
            const applies = this.onlyFor === null || this.onlyFor === connections[0]?.connectionId;
            if (applies && this.mode === "throw") {
                throw new Error(this.failureMessage);
            }
            if (applies && this.mode === "fail") {
                return Result.fail(new FakeWebsocketFailure(this.failureMessage) as never);
            }
            return Result.ok();
        } finally {
            this.inFlight -= 1;
        }
    }
}
```

Create `packages/api-workflows/__tests__/__helpers/RecordingNotificationTransport.ts`:

```ts
import { NotificationTransport } from "~/features/notifications/NotificationTransport/index.js";

export interface SentTransportMessage {
    users: NotificationTransport.User[];
    message: NotificationTransport.Message;
}

/**
 * A custom transport that records what it is asked to send. `order` is an optional shared list a
 * test passes to several transports to see the order they were called in. With `mode: "throw"` it
 * throws (a broken third-party transport). Register with
 * `container.registerInstance(NotificationTransport, transport)`; use an id other than
 * `"e-mail"`, which the built-in transport owns.
 */
export class RecordingNotificationTransport implements NotificationTransport.Interface {
    public readonly title: string;
    public readonly sent: SentTransportMessage[] = [];
    public mode: "ok" | "throw" = "ok";
    public failureMessage = "The transport failed.";

    public constructor(
        public readonly id: string,
        private readonly order: string[] = []
    ) {
        this.title = id;
    }

    public async send(params: NotificationTransport.SendParams): Promise<void> {
        this.order.push(this.id);
        this.sent.push({ users: structuredClone(params.users), message: { ...params.message } });
        if (this.mode === "throw") {
            throw Object.assign(new Error(this.failureMessage), { code: "TRANSPORT_FAILED" });
        }
    }
}
```

Create `packages/api-workflows/__tests__/__helpers/FakeWorkflowsAdminUrl.ts`:

```ts
import { WorkflowsAdminUrlService } from "~/features/notifications/WorkflowsAdminUrlService/index.js";

/**
 * The admin host a test link is built on, without service discovery. `url: null` is "no host",
 * `mode: "throw"` makes `get` throw (the link service must turn that into no link), `calls` counts
 * the lookups. Register with `container.registerInstance(WorkflowsAdminUrlService, fake)`.
 */
export class FakeWorkflowsAdminUrl implements WorkflowsAdminUrlService.Interface {
    public url: string | null = "https://admin.example.com";
    public mode: "ok" | "throw" = "ok";
    public calls = 0;

    public async get(): Promise<string | null> {
        this.calls += 1;
        if (this.mode === "throw") {
            throw new Error("Service discovery is not available.");
        }
        return this.url;
    }
}
```

Create `packages/api-workflows/__tests__/__helpers/FakeReviewTargetLink.ts`:

```ts
import { ReviewTargetLink } from "~/features/notifications/ReviewTargetLink/index.js";

/**
 * A `ReviewTargetLink` for the `cms.*` namespaces, shaped like the CMS adapter's (`api-headless-cms-workflows`
 * is not a dependency of this package). `paths` records every path it was asked for, so a test can
 * prove that no link was built. Register with `container.registerInstance(ReviewTargetLink, fake)`.
 */
export class FakeReviewTargetLink implements ReviewTargetLink.Interface {
    public readonly paths: string[] = [];

    public canLink(model: string): boolean {
        return model.startsWith("cms.");
    }

    public getPath(params: ReviewTargetLink.Params): string {
        const path = `/cms/content-entries/article?id=${encodeURIComponent(params.targetRevisionId)}`;
        this.paths.push(path);
        return path;
    }
}
```

In `packages/api-workflows/__tests__/notifications/MailNotificationTransport.test.ts` (created by Task 3) switch to the shared fake. Edits:

1. Replace the import line `import { BaseError, Result } from "@webiny/feature/api";` with nothing (delete it; `BaseError` and `Result` were used only by the local fake) and add, after the `captureLoggedErrors` import:
   ```ts
   import { RecordingMailer, type SentMail } from "~tests/__helpers/RecordingMailer.js";
   ```
2. Delete the three local definitions `type SentMail = ...`, `class SmtpFailure ...` and `class FakeMailer ...` (the comment above `FakeMailer` goes with it).
3. Rename every remaining `FakeMailer` to `RecordingMailer` (including `class ObjectCodeMailer extends RecordingMailer` and `createTransport(mailer: RecordingMailer)`). Command: `sed -i '' 's/FakeMailer/RecordingMailer/g' packages/api-workflows/__tests__/notifications/MailNotificationTransport.test.ts`.

Create `packages/api-workflows/__tests__/notifications/getErrorLogFields.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { BaseError } from "@webiny/feature/api";
import { getErrorLogFields } from "~/domain/notifications/getErrorLogFields.js";

class CodedError extends BaseError {
    override readonly code = "Workflows/Coded" as const;

    public constructor() {
        super({ message: "secret@webiny.test is not allowed." });
    }
}

describe("getErrorLogFields (R196)", () => {
    it("returns the code and the name of an error that has them", () => {
        const error = Object.assign(new Error("boom"), { code: "ECONNRESET" });

        expect(getErrorLogFields(error)).toEqual({ errorCode: "ECONNRESET", errorName: "Error" });
    });

    it("returns the code of a BaseError subclass, and the name it reports", () => {
        expect(getErrorLogFields(new CodedError())).toEqual({
            errorCode: "Workflows/Coded",
            errorName: "Error"
        });
    });

    it("never returns a message", () => {
        expect(JSON.stringify(getErrorLogFields(new CodedError()))).not.toContain("secret@");
    });

    it("returns undefined for a code or name that is not a string", () => {
        expect(
            getErrorLogFields({ code: { address: "anna@webiny.test" }, name: ["anna@webiny.test"] })
        ).toEqual({ errorCode: undefined, errorName: undefined });
    });

    it("returns undefined for values that are not objects", () => {
        expect(getErrorLogFields("boom")).toEqual({ errorCode: undefined, errorName: undefined });
        expect(getErrorLogFields(null)).toEqual({ errorCode: undefined, errorName: undefined });
        expect(getErrorLogFields(undefined)).toEqual({
            errorCode: undefined,
            errorName: undefined
        });
    });
});
```

Create `packages/api-workflows/__tests__/notifications/ReviewNotifierService.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MailerService } from "@webiny/api-mailer";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import {
    WebsocketsListConnectionsUseCase,
    WebsocketsSendToConnectionsUseCase
} from "@webiny/api-websockets/exports/api.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { registerFaultyTenantContext, tenantFault } from "~tests/__helpers/FaultyTenantContext.js";
import { FakeListUsers, type FakeUser } from "~tests/__helpers/FakeListUsers.js";
import { RecordingMailer } from "~tests/__helpers/RecordingMailer.js";
import { FakeWebsocketConnections } from "~tests/__helpers/FakeWebsocketConnections.js";
import { RecordingWebsocketsSend } from "~tests/__helpers/RecordingWebsocketsSend.js";
import { RecordingNotificationTransport } from "~tests/__helpers/RecordingNotificationTransport.js";
import { FakeWorkflowsAdminUrl } from "~tests/__helpers/FakeWorkflowsAdminUrl.js";
import { FakeReviewTargetLink } from "~tests/__helpers/FakeReviewTargetLink.js";
import { createReviewStep, createStartedReview, createWorkflow } from "~tests/__helpers/fixtures.js";
import { WORKFLOWS_NOTIFICATION_WEBSOCKET_ACTION } from "~/domain/notifications/constants.js";
import type { NotificationMessage } from "~/domain/notifications/types.js";
import type { ReviewData } from "~/domain/review/types.js";
import { NotificationTransport } from "~/features/notifications/NotificationTransport/index.js";
import {
    NotificationRecipientService,
    NotificationRecipientServiceFeature,
    type NotificationRecipient
} from "~/features/notifications/NotificationRecipientService/index.js";
import { WorkflowsAdminUrlService } from "~/features/notifications/WorkflowsAdminUrlService/index.js";
import { ReviewTargetLink } from "~/features/notifications/ReviewTargetLink/index.js";
import {
    ReviewTargetLinkService,
    ReviewTargetLinkServiceFeature
} from "~/features/notifications/ReviewTargetLinkService/index.js";
import {
    ReviewNotifierService,
    ReviewNotifierServiceFeature,
    type ReviewNotifyParams
} from "~/features/notifications/ReviewNotifierService/index.js";

const SECRET = "SECRET-TOKEN-4711";
const WEBSOCKET_TEXT = "Could not send a workflow websocket notification.";
const LOOKUP_TEXT = "Could not look up the users to e-mail.";
const TRANSPORT_TEXT = "Could not send a workflow notification through a transport.";
const UNKNOWN_TRANSPORT_TEXT = "A step names a notification transport that is not registered.";
const LINK_TEXT = "Could not build the workflow notification link.";

const ANNA: NotificationRecipient = { id: "user-anna", displayName: "Anna" };
const BOB: NotificationRecipient = { id: "user-bob", displayName: "Bob" };

const USERS: FakeUser[] = [
    { id: "user-anna", displayName: "Anna", teams: [] },
    { id: "user-bob", displayName: "Bob", teams: [] }
];

const MESSAGE: NotificationMessage = {
    title: "“Article 1” was approved",
    body: "All steps approved. It’s ready to publish.",
    subject: "Approved: Article 1",
    text: "Every step approved this revision. It’s ready to publish.",
    linkLabel: "Open content"
};

/**
 * Two steps with different channels (Review Focus 8): "legal" lists `chat` twice, an unknown
 * `missing` and `chat-b`; "editorial" lists `chat-b` only; "plain" lists nothing.
 */
const createReview = (): ReviewData => {
    const workflow = createWorkflow({
        steps: [
            {
                ...createReviewStep({ id: "legal", title: "Legal review", allowManualPick: true }),
                notifications: [{ id: "chat" }, { id: "missing" }, { id: "chat" }, { id: "chat-b" }]
            },
            {
                ...createReviewStep({ id: "editorial", title: "Editorial review" }),
                notifications: [{ id: "chat-b" }]
            },
            createReviewStep({ id: "plain", title: "Plain review" })
        ]
    });
    return createStartedReview({ workflow }).toData();
};

/** The same review, but "legal" notifies through the built-in e-mail transport. */
const createMailReview = (): ReviewData => {
    const review = createReview();
    review.steps[0].notifications = [{ id: "e-mail" }];
    return review;
};

class ThrowingListUsers implements ListUsersUseCase.Interface {
    public async execute(): Promise<never> {
        throw new Error(`The user lookup crashed for anna@webiny.test ${SECRET}.`);
    }
}

class ThrowingLinkService implements ReviewTargetLinkService.Interface {
    public async getUrl(): Promise<string | null> {
        throw new Error("The link service crashed.");
    }
}

class ThrowingRecipientService implements NotificationRecipientService.Interface {
    public async listPool(): NotificationRecipientService.PoolReturn {
        throw new Error("Not used by these tests.");
    }

    public async listUsers(): NotificationRecipientService.UsersReturn {
        throw new Error(`The recipient service crashed ${SECRET}.`);
    }
}

interface SetupParams {
    users?: ListUsersUseCase.Interface;
    link?: ReviewTargetLinkService.Interface;
    recipients?: NotificationRecipientService.Interface;
}

const setup = async (params: SetupParams = {}) => {
    const order: string[] = [];
    const mailer = new RecordingMailer();
    const connections = new FakeWebsocketConnections();
    const sends = new RecordingWebsocketsSend();
    const chat = new RecordingNotificationTransport("chat", order);
    const chatB = new RecordingNotificationTransport("chat-b", order);
    const adminUrl = new FakeWorkflowsAdminUrl();
    const link = new FakeReviewTargetLink();
    const users = new FakeListUsers(USERS);
    const { context } = await createContextHandler({
        setup: container => {
            captureLoggedErrors(container);
            registerFaultyTenantContext(container);
            container.registerInstance(MailerService, mailer);
            container.registerInstance(WebsocketsListConnectionsUseCase, connections);
            container.registerInstance(WebsocketsSendToConnectionsUseCase, sends);
            container.registerInstance(NotificationTransport, chat);
            container.registerInstance(NotificationTransport, chatB);
            container.registerInstance(WorkflowsAdminUrlService, adminUrl);
            container.registerInstance(ReviewTargetLink, link);
            container.registerInstance(ListUsersUseCase, params.users ?? users);
            NotificationRecipientServiceFeature.register(container);
            ReviewTargetLinkServiceFeature.register(container);
            ReviewNotifierServiceFeature.register(container);
            if (params.recipients) {
                container.registerInstance(NotificationRecipientService, params.recipients);
            }
            if (params.link) {
                container.registerInstance(ReviewTargetLinkService, params.link);
            }
        }
    });
    const notifier = context.container.resolve(ReviewNotifierService);
    const tenantId = context.container.resolve(TenantContext).getTenant().id;

    return {
        order,
        mailer,
        connections,
        sends,
        chat,
        chatB,
        adminUrl,
        link,
        users,
        tenantId,
        notify: (overrides: Partial<ReviewNotifyParams> = {}): Promise<void> => {
            return notifier.notify({
                review: createReview(),
                stepId: "legal",
                event: "approved",
                recipients: [ANNA, BOB],
                message: MESSAGE,
                ...overrides
            });
        }
    };
};

describe("ReviewNotifierService (R186-R188, R192-R197)", () => {
    beforeEach(() => {
        loggedErrors.length = 0;
        tenantFault.mode = "none";
    });

    afterEach(() => {
        tenantFault.mode = "none";
    });

    describe("websocket (R187, R188)", () => {
        it("sends one frame with exactly the R187 data, to the recipient's current-tenant connection", async () => {
            const { notify, connections, sends, tenantId } = await setup();
            connections.connect("user-anna", tenantId, "conn-anna");
            const review = createReview();

            await notify({ review, stepId: "editorial", recipients: [ANNA] });

            expect(sends.sent).toEqual([
                {
                    connections: [{ connectionId: "conn-anna", endpoint: "wss://websockets.test" }],
                    message: {
                        action: WORKFLOWS_NOTIFICATION_WEBSOCKET_ACTION,
                        data: {
                            event: "approved",
                            reviewId: "review-1",
                            stepId: "editorial",
                            namespace: "cms.article",
                            targetId: "article-1",
                            targetRevisionId: "article-1#0001",
                            title: MESSAGE.title,
                            body: MESSAGE.body
                        }
                    }
                }
            ]);
            expect(Object.keys(sends.sent[0].message.data ?? {}).sort()).toEqual([
                "body",
                "event",
                "namespace",
                "reviewId",
                "stepId",
                "targetId",
                "targetRevisionId",
                "title"
            ]);
            expect(Object.keys(sends.sent[0].message).sort()).toEqual(["action", "data"]);
            expect(connections.calls).toEqual([{ where: { identityId: "user-anna" } }]);
        });

        it("carries a null stepId and the namespace of the review", async () => {
            const { notify, connections, sends, tenantId } = await setup();
            connections.connect("user-anna", tenantId, "conn-anna");

            await notify({ stepId: null, event: "cancelled", recipients: [ANNA] });

            expect(sends.sent[0].message.data).toMatchObject({
                event: "cancelled",
                stepId: null,
                namespace: "cms.article"
            });
        });

        it("sends only to the recipients, never to other users with connections", async () => {
            const { notify, connections, sends, tenantId } = await setup();
            connections
                .connect("user-anna", tenantId, "conn-anna")
                .connect("user-bob", tenantId, "conn-bob")
                .connect("user-dan", tenantId, "conn-dan");

            await notify({ recipients: [ANNA] });

            expect(sends.sent.map(frame => frame.connections.map(item => item.connectionId))).toEqual([
                ["conn-anna"]
            ]);
        });

        it("sends one frame per recipient, with every connection of that recipient in the tenant", async () => {
            const { notify, connections, sends, tenantId } = await setup();
            connections
                .connect("user-anna", tenantId, "anna-tab-1")
                .connect("user-anna", tenantId, "anna-tab-2")
                .connect("user-bob", tenantId, "bob-tab-1");

            await notify();

            // Order-independent: batches run concurrently.
            const frames = sends.sent
                .map(frame => frame.connections.map(item => item.connectionId).sort())
                .sort((a, b) => a[0].localeCompare(b[0]));
            expect(frames).toEqual([["anna-tab-1", "anna-tab-2"], ["bob-tab-1"]]);
        });

        it("sends a recipient listed twice once", async () => {
            const { notify, connections, sends, tenantId } = await setup();
            connections.connect("user-anna", tenantId, "conn-anna");

            await notify({ recipients: [ANNA, ANNA] });

            expect(sends.sent).toHaveLength(1);
            expect(connections.calls).toHaveLength(1);
        });

        it("does nothing at all without recipients", async () => {
            const { notify, connections, sends, users } = await setup();

            await notify({ recipients: [] });

            expect(connections.calls).toEqual([]);
            expect(sends.sent).toEqual([]);
            expect(users.calls).toEqual([]);
        });

        it("makes no list call for a recipient with an empty or missing id (R188)", async () => {
            const { notify, connections, sends, tenantId } = await setup();
            connections.connect("user-anna", tenantId, "conn-anna");

            await notify({
                recipients: [
                    { id: "", displayName: "Nobody" },
                    { id: undefined as unknown as string, displayName: "Undefined" }
                ]
            });

            expect(connections.calls).toEqual([]);
            expect(sends.sent).toEqual([]);
            expect(loggedErrors).toEqual([]);
        });

        it("still notifies the recipients with an id when others have none", async () => {
            const { notify, connections, sends, tenantId } = await setup();
            connections.connect("user-anna", tenantId, "conn-anna");

            await notify({ recipients: [{ id: "", displayName: "Nobody" }, ANNA] });

            expect(connections.calls).toEqual([{ where: { identityId: "user-anna" } }]);
            expect(sends.sent).toHaveLength(1);
        });

        it("sends to the connection of the current tenant only, not to the same user in another tenant (R188, A63)", async () => {
            const { notify, connections, sends, tenantId } = await setup();
            connections
                .connect("user-anna", "another-tenant", "conn-other-tenant")
                .connect("user-anna", tenantId, "conn-this-tenant");

            await notify({ recipients: [ANNA] });

            expect(sends.sent).toHaveLength(1);
            expect(sends.sent[0].connections).toEqual([
                { connectionId: "conn-this-tenant", endpoint: "wss://websockets.test" }
            ]);
        });

        it("sends nothing, and logs nothing, to a recipient connected only in another tenant", async () => {
            const { notify, connections, sends } = await setup();
            connections.connect("user-anna", "another-tenant", "conn-other-tenant");

            await expect(notify({ recipients: [ANNA] })).resolves.toBeUndefined();

            expect(connections.calls).toEqual([{ where: { identityId: "user-anna" } }]);
            expect(sends.sent).toEqual([]);
            expect(loggedErrors).toEqual([]);
        });

        it("sends nothing, and logs nothing, to a recipient with no connection", async () => {
            const { notify, sends } = await setup();

            await notify({ recipients: [ANNA] });

            expect(sends.sent).toEqual([]);
            expect(loggedErrors).toEqual([]);
        });

        it("sends nothing and logs once when there is no current tenant", async () => {
            const { notify, connections, sends } = await setup();
            connections.connect("user-anna", "root", "conn-anna");
            tenantFault.mode = "missing";

            await expect(notify({ stepId: null, recipients: [ANNA, BOB] })).resolves.toBeUndefined();

            expect(connections.calls).toEqual([]);
            expect(sends.sent).toEqual([]);
            expect(loggedErrors).toHaveLength(1);
            expect(loggedErrors[0].message).toBe(WEBSOCKET_TEXT);
            expect(loggedErrors[0].fields).toEqual({ reviewId: "review-1", event: "approved" });
        });

        it("sends nothing and logs once when the tenant read throws", async () => {
            const { notify, connections, sends } = await setup();
            connections.connect("user-anna", "root", "conn-anna");
            tenantFault.mode = "throws";

            await expect(notify({ stepId: null, recipients: [ANNA, BOB] })).resolves.toBeUndefined();

            expect(sends.sent).toEqual([]);
            expect(loggedErrors).toHaveLength(1);
            expect(loggedErrors[0].message).toBe(WEBSOCKET_TEXT);
            expect(loggedErrors[0].fields).toEqual({
                errorName: "Error",
                reviewId: "review-1",
                event: "approved"
            });
        });
    });

    describe("transports (R186, R192, R194, R195)", () => {
        it("makes no lookup and no link call when the step has no transport", async () => {
            const { notify, users, adminUrl, link, tenantId, connections } = await setup();
            connections.connect("user-anna", tenantId, "conn-anna");

            await notify({ stepId: "plain" });

            expect(users.calls).toEqual([]);
            expect(adminUrl.calls).toBe(0);
            expect(link.paths).toEqual([]);
        });

        it("makes no lookup when the step id is null or names no step", async () => {
            const { notify, users, adminUrl } = await setup();

            await notify({ stepId: null });
            await notify({ stepId: "no-such-step" });

            expect(users.calls).toEqual([]);
            expect(adminUrl.calls).toBe(0);
        });

        it("uses the channels of the step it is given (Review Focus 8)", async () => {
            const { notify, chat, chatB } = await setup();

            await notify({ stepId: "editorial" });

            expect(chat.sent).toEqual([]);
            expect(chatB.sent).toHaveLength(1);
        });

        it("calls each registered transport of the step once, in the step's order, and skips an unknown and a duplicate id", async () => {
            const { notify, chat, chatB, order } = await setup();

            await notify({ stepId: "legal" });

            expect(order).toEqual(["chat", "chat-b"]);
            expect(chat.sent).toHaveLength(1);
            expect(chatB.sent).toHaveLength(1);
            expect(loggedErrors).toEqual([
                {
                    message: UNKNOWN_TRANSPORT_TEXT,
                    fields: { reviewId: "review-1", stepId: "legal", transportId: "missing" }
                }
            ]);
        });

        it("sends the message shape of R190 to every transport, with the looked-up users and the link", async () => {
            const { notify, chat, users, tenantId } = await setup();

            await notify({ stepId: "legal" });

            expect(users.calls).toHaveLength(1);
            expect(users.calls[0].input).toEqual({ where: { id_in: ["user-anna", "user-bob"] } });
            expect(chat.sent).toEqual([
                {
                    users: [
                        { id: "user-anna", email: "user-anna@webiny.test", displayName: "Anna" },
                        { id: "user-bob", email: "user-bob@webiny.test", displayName: "Bob" }
                    ],
                    message: {
                        title: MESSAGE.subject,
                        body: MESSAGE.text,
                        url: `https://admin.example.com/cms/content-entries/article?id=article-1%230001&tenantId=${tenantId}`,
                        linkLabel: MESSAGE.linkLabel
                    }
                }
            ]);
        });

        it("builds the link once per notification, however many transports send it", async () => {
            const { notify, link, adminUrl } = await setup();

            await notify({ stepId: "legal" });

            expect(link.paths).toHaveLength(1);
            expect(adminUrl.calls).toBe(1);
        });

        it("passes url null to the transport and logs nothing itself when there is no admin host", async () => {
            const { notify, chatB, adminUrl } = await setup();
            adminUrl.url = null;

            await notify({ stepId: "editorial" });

            expect(chatB.sent).toHaveLength(1);
            expect(chatB.sent[0].message.url).toBeNull();
            expect(loggedErrors).toEqual([]);
        });

        it("sends no transport message when none of the recipients has a user", async () => {
            const { notify, chatB } = await setup();

            await notify({
                stepId: "editorial",
                recipients: [{ id: "user-unknown", displayName: "Api key" }]
            });

            expect(chatB.sent).toEqual([]);
            expect(loggedErrors).toEqual([]);
        });

        it("reaches the real e-mail transport and the mailer with the subject, the text and the link", async () => {
            const { notify, mailer, tenantId } = await setup();

            await notify({ review: createMailReview(), stepId: "legal" });

            expect(mailer.sent).toHaveLength(1);
            expect(mailer.sent[0]).toMatchObject({
                bcc: ["user-anna@webiny.test", "user-bob@webiny.test"],
                subject: "Approved: Article 1"
            });
            expect(mailer.sent[0].text).toContain("Every step approved this revision.");
            expect(mailer.sent[0].text).toContain(
                `Open content: https://admin.example.com/cms/content-entries/article?id=article-1%230001&tenantId=${tenantId}`
            );
        });
    });

    describe("failures never fail the action (R87, R196, Review Focus 1)", () => {
        it("a throwing connection list for one recipient is logged once and the others still get their frame", async () => {
            const { notify, connections, sends, tenantId } = await setup();
            connections
                .connect("user-anna", tenantId, "conn-anna")
                .connect("user-bob", tenantId, "conn-bob");
            connections.mode = "throw";
            connections.onlyFor = "user-anna";
            connections.failureMessage = `The list crashed ${SECRET}.`;

            await expect(notify({ stepId: "plain" })).resolves.toBeUndefined();

            expect(sends.sent.map(frame => frame.connections[0].connectionId)).toEqual(["conn-bob"]);
            expect(loggedErrors).toEqual([
                {
                    message: WEBSOCKET_TEXT,
                    fields: {
                        errorName: "Error",
                        errorMessage: `The list crashed ${SECRET}.`,
                        reviewId: "review-1",
                        event: "approved",
                        recipientId: "user-anna"
                    }
                }
            ]);
        });

        it("a failed connection list is logged once per recipient with the error code and name", async () => {
            const { notify, connections, sends, tenantId } = await setup();
            connections
                .connect("user-anna", tenantId, "conn-anna")
                .connect("user-bob", tenantId, "conn-bob");
            connections.mode = "fail";

            await expect(notify({ stepId: "plain" })).resolves.toBeUndefined();

            expect(sends.sent).toEqual([]);
            expect(loggedErrors.map(item => item.message)).toEqual([WEBSOCKET_TEXT, WEBSOCKET_TEXT]);
            expect(loggedErrors.map(item => item.fields.recipientId)).toEqual([
                "user-anna",
                "user-bob"
            ]);
            expect(loggedErrors[0].fields).toMatchObject({
                errorCode: "Websocket/Service",
                errorName: "Error",
                reviewId: "review-1",
                event: "approved"
            });
        });

        it("a throwing send for one recipient is logged once and the others still get their frame", async () => {
            const { notify, connections, sends, tenantId } = await setup();
            connections
                .connect("user-anna", tenantId, "conn-anna")
                .connect("user-bob", tenantId, "conn-bob");
            sends.mode = "throw";
            sends.onlyFor = "conn-anna";

            await expect(notify({ stepId: "plain" })).resolves.toBeUndefined();

            expect(sends.sent.map(frame => frame.connections[0].connectionId)).toEqual([
                "conn-anna",
                "conn-bob"
            ]);
            expect(loggedErrors).toHaveLength(1);
            expect(loggedErrors[0].message).toBe(WEBSOCKET_TEXT);
            expect(loggedErrors[0].fields).toMatchObject({ recipientId: "user-anna" });
        });

        it("a failed send is logged once per recipient", async () => {
            const { notify, connections, tenantId, sends } = await setup();
            connections.connect("user-anna", tenantId, "conn-anna");
            sends.mode = "fail";

            await expect(notify({ stepId: "plain", recipients: [ANNA] })).resolves.toBeUndefined();

            expect(loggedErrors).toHaveLength(1);
            expect(loggedErrors[0].message).toBe(WEBSOCKET_TEXT);
            expect(loggedErrors[0].fields).toMatchObject({
                errorCode: "Websocket/Service",
                recipientId: "user-anna"
            });
        });

        it("a failed websocket does not stop the transports", async () => {
            const { notify, connections, tenantId, sends, chatB } = await setup();
            connections.connect("user-anna", tenantId, "conn-anna");
            sends.mode = "throw";

            await expect(notify({ stepId: "editorial" })).resolves.toBeUndefined();

            expect(chatB.sent).toHaveLength(1);
            expect(loggedErrors.map(item => item.message)).toEqual([WEBSOCKET_TEXT]);
        });

        it("a failed user lookup is logged once with code and name only, the websocket still went out and no transport runs", async () => {
            const { notify, connections, tenantId, sends, users, chat, chatB } = await setup();
            connections.connect("user-anna", tenantId, "conn-anna");
            users.failuresLeft = 1;

            await expect(notify({ stepId: "legal", recipients: [ANNA] })).resolves.toBeUndefined();

            expect(sends.sent).toHaveLength(1);
            expect(chat.sent).toEqual([]);
            expect(chatB.sent).toEqual([]);
            expect(loggedErrors.filter(item => item.message === LOOKUP_TEXT)).toEqual([
                {
                    message: LOOKUP_TEXT,
                    fields: {
                        errorCode: "Workflows/Workflow/Persistence",
                        errorName: "Error",
                        reviewId: "review-1",
                        event: "approved"
                    }
                }
            ]);
        });

        it("a throwing user lookup is logged once with code and name only, never the message", async () => {
            const { notify, connections, tenantId, sends, chatB } = await setup({
                users: new ThrowingListUsers()
            });
            connections.connect("user-anna", tenantId, "conn-anna");

            await expect(notify({ stepId: "editorial", recipients: [ANNA] })).resolves.toBeUndefined();

            expect(sends.sent).toHaveLength(1);
            expect(chatB.sent).toEqual([]);
            expect(loggedErrors).toHaveLength(1);
            expect(loggedErrors[0].message).toBe(LOOKUP_TEXT);
            expect(JSON.stringify(loggedErrors)).not.toContain(SECRET);
            expect(JSON.stringify(loggedErrors)).not.toContain("anna@webiny.test");
        });

        it("a recipient service that rejects is logged as a failed lookup", async () => {
            const { notify, connections, tenantId, sends, chatB } = await setup({
                recipients: new ThrowingRecipientService()
            });
            connections.connect("user-anna", tenantId, "conn-anna");

            await expect(notify({ stepId: "editorial", recipients: [ANNA] })).resolves.toBeUndefined();

            expect(sends.sent).toHaveLength(1);
            expect(chatB.sent).toEqual([]);
            expect(loggedErrors).toHaveLength(1);
            expect(loggedErrors[0].message).toBe(LOOKUP_TEXT);
            expect(JSON.stringify(loggedErrors)).not.toContain(SECRET);
        });

        it("a throwing transport is logged once with code and name only and the other transport still sends", async () => {
            const { notify, chat, chatB } = await setup();
            chat.mode = "throw";
            chat.failureMessage = `The transport crashed ${SECRET}.`;

            await expect(notify({ stepId: "legal" })).resolves.toBeUndefined();

            expect(chatB.sent).toHaveLength(1);
            expect(loggedErrors.filter(item => item.message === TRANSPORT_TEXT)).toEqual([
                {
                    message: TRANSPORT_TEXT,
                    fields: {
                        transportId: "chat",
                        errorCode: "TRANSPORT_FAILED",
                        errorName: "Error",
                        reviewId: "review-1",
                        event: "approved"
                    }
                }
            ]);
            expect(JSON.stringify(loggedErrors)).not.toContain(SECRET);
        });

        it("a failing admin host lookup is logged once by the link service and the transport still sends without a link", async () => {
            const { notify, adminUrl, chatB } = await setup();
            adminUrl.mode = "throw";

            await expect(notify({ stepId: "editorial" })).resolves.toBeUndefined();

            expect(chatB.sent).toHaveLength(1);
            expect(chatB.sent[0].message.url).toBeNull();
            expect(loggedErrors).toHaveLength(1);
            expect(loggedErrors[0].message).toBe(LINK_TEXT);
        });

        it("a throwing tenant read in the link is logged once by the link service and the mail goes without a link", async () => {
            const { notify, connections, chatB } = await setup();
            connections.connect("user-anna", "root", "conn-anna");
            tenantFault.mode = "throws";

            await expect(notify({ stepId: "editorial" })).resolves.toBeUndefined();

            expect(chatB.sent).toHaveLength(1);
            expect(chatB.sent[0].message.url).toBeNull();
            expect(loggedErrors.map(item => item.message)).toContain(LINK_TEXT);
        });

        it("a link service that rejects is caught, logged once, and the websocket already went out", async () => {
            const { notify, connections, tenantId, sends, chatB } = await setup({
                link: new ThrowingLinkService()
            });
            connections.connect("user-anna", tenantId, "conn-anna");

            await expect(notify({ stepId: "editorial", recipients: [ANNA] })).resolves.toBeUndefined();

            expect(sends.sent).toHaveLength(1);
            expect(chatB.sent).toEqual([]);
            expect(loggedErrors.map(item => item.message)).toEqual([TRANSPORT_TEXT]);
        });

        it("a failing mailer behind the e-mail transport is logged by the transport and the websocket still went out", async () => {
            const { notify, mailer, connections, tenantId, sends } = await setup();
            connections.connect("user-anna", tenantId, "conn-anna");
            mailer.failOn = [0];
            mailer.failureMessage = `SMTP refused anna@webiny.test ${SECRET}.`;

            await expect(
                notify({ review: createMailReview(), stepId: "legal", recipients: [ANNA] })
            ).resolves.toBeUndefined();

            expect(sends.sent).toHaveLength(1);
            expect(mailer.sent).toHaveLength(1);
            expect(loggedErrors).toHaveLength(1);
            expect(loggedErrors[0].message).toBe("Could not send a workflow notification e-mail.");
            expect(JSON.stringify(loggedErrors)).not.toContain(SECRET);
            expect(JSON.stringify(loggedErrors)).not.toContain("anna@webiny.test");
        });

        it("a throwing mailer behind the e-mail transport resolves", async () => {
            const { notify, mailer } = await setup();
            mailer.throwOn = [0];

            await expect(
                notify({ review: createMailReview(), stepId: "legal" })
            ).resolves.toBeUndefined();

            expect(loggedErrors.map(item => item.message)).toEqual([
                "Could not send a workflow notification e-mail."
            ]);
        });
    });

    describe("raw error text never reaches a message (R146 mirror, Review Focus 4)", () => {
        it("a failing mailer, websocket, lookup and transport leave the secret in no sent message", async () => {
            const { notify, connections, tenantId, sends, chat, chatB, mailer } = await setup();
            connections.connect("user-anna", tenantId, "conn-anna");
            connections.connect("user-bob", tenantId, "conn-bob");
            sends.mode = "throw";
            sends.onlyFor = "conn-anna";
            sends.failureMessage = `The send crashed ${SECRET}.`;
            chat.mode = "throw";
            chat.failureMessage = `The transport crashed ${SECRET}.`;
            mailer.failOn = [0];
            mailer.failureMessage = `SMTP refused ${SECRET}.`;

            await notify({ stepId: "legal" });
            await notify({ review: createMailReview(), stepId: "legal" });

            const sentTexts = JSON.stringify([sends.sent, chat.sent, chatB.sent, mailer.sent]);
            expect(sentTexts).not.toContain(SECRET);
            expect(loggedErrors.length).toBeGreaterThan(0);
        });

        it("the websocket error message is in the log, the lookup and transport messages are not (R196)", async () => {
            const { notify, connections, tenantId, sends, chat } = await setup();
            connections.connect("user-anna", tenantId, "conn-anna");
            sends.mode = "throw";
            sends.failureMessage = `The send crashed ${SECRET}.`;
            chat.mode = "throw";
            chat.failureMessage = `The transport crashed ${SECRET}.`;

            await notify({ stepId: "legal", recipients: [ANNA] });

            const websocketLogs = loggedErrors.filter(item => item.message === WEBSOCKET_TEXT);
            const transportLogs = loggedErrors.filter(item => item.message === TRANSPORT_TEXT);
            expect(JSON.stringify(websocketLogs)).toContain(SECRET);
            expect(JSON.stringify(transportLogs)).not.toContain(SECRET);
        });
    });

    describe("fan-out (R197, A65, Review Focus 9)", () => {
        it("sends 25 frames with at most 10 connection lists and 10 sends in flight", async () => {
            const { notify, connections, sends, tenantId } = await setup();
            const recipients: NotificationRecipient[] = Array.from({ length: 25 }, (_, index) => ({
                id: `user-${index}`,
                displayName: `User ${index}`
            }));
            for (const recipient of recipients) {
                connections.connect(recipient.id, tenantId, `conn-${recipient.id}`);
            }
            connections.holdMs = 5;
            sends.holdMs = 5;

            await notify({ stepId: "plain", recipients });

            expect(sends.sent).toHaveLength(25);
            expect(new Set(sends.sent.map(frame => frame.connections[0].connectionId)).size).toBe(25);
            expect(connections.maxInFlight).toBe(10);
            expect(sends.maxInFlight).toBe(10);
        });
    });
});
```

- [ ] **Step 2: Run the tests to see them fail**

Run each file on its own:
`yarn test packages/api-workflows/__tests__/notifications/getErrorLogFields.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/notifications/ReviewNotifierService.test.ts 2>&1 | tail -50`
Expected: FAIL (the modules `getErrorLogFields.js` and `ReviewNotifierService/index.js` do not exist; the notifier test also cannot resolve `@webiny/api-websockets/exports/api.js` until Step 3 adds the dependency).

Run `yarn test:os packages/api-workflows/__tests__/notifications/ReviewNotifierService.test.ts 2>&1 | tail -50`.
Expected: the same failure.

`MailNotificationTransport.test.ts` must still pass after the switch to the shared fake (it only needs the helper, which exists now):
`yarn test packages/api-workflows/__tests__/notifications/MailNotificationTransport.test.ts 2>&1 | tail -50`
Expected: PASS.

- [ ] **Step 3: Implement**

In `packages/api-workflows/package.json` add the dependency, keeping the list sorted (after `@webiny/api-mailer`):

```json
    "@webiny/api-mailer": "0.0.0",
    "@webiny/api-websockets": "0.0.0",
    "@webiny/background-tasks": "0.0.0",
```

Then link it and make sure its built `exports` exist (tests and the type check resolve the package from its built output, like `api-aco` does):

```bash
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
ls packages/api-websockets/dist/exports/api.js
```

Expected: the `ls` prints the path. If it does not exist, run `yarn build -p @webiny/api-websockets --no-cache 2>&1 | tail -30` first. `generateTsConfigsInPackages.js` adds the `../api-websockets` reference and path mapping to `packages/api-workflows/tsconfig.json` and `tsconfig.build.json`.

Create `packages/api-workflows/src/domain/notifications/getErrorLogFields.ts`:

```ts
/** What `getErrorLogFields` reads from a caught value: only these two, and only when strings. */
interface ErrorLike {
    code?: unknown;
    name?: unknown;
}

export interface ErrorLogFields {
    errorCode: string | undefined;
    errorName: string | undefined;
}

/**
 * The only parts of a caught value a notification log carries (R196): its `code` and `name`, and
 * only when they are strings. Never the message (it can embed addresses or tokens), never the
 * error object. A `BaseError` subclass reports `"Error"` as its name. Pure.
 */
export const getErrorLogFields = (error: unknown): ErrorLogFields => {
    const source: ErrorLike = typeof error === "object" && error !== null ? error : {};
    return {
        errorCode: typeof source.code === "string" ? source.code : undefined,
        errorName: typeof source.name === "string" ? source.name : undefined
    };
};
```

Create `packages/api-workflows/src/features/notifications/ReviewNotifierService/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";
import type { ReviewData } from "~/domain/review/types.js";
import type {
    NotificationMessage,
    WorkflowNotificationEvent
} from "~/domain/notifications/types.js";
import type { NotificationRecipient } from "~/features/notifications/NotificationRecipientService/abstractions.js";

export interface ReviewNotifyParams {
    /** The saved review: the namespace, ids and the steps whose channels are used. */
    review: ReviewData;
    /** The step whose `notifications` choose the transports (R186); `null` sends no transport. */
    stepId: string | null;
    event: WorkflowNotificationEvent;
    /** Already filtered by the handler (R183, R184); duplicates are removed here. */
    recipients: NotificationRecipient[];
    message: NotificationMessage;
}

export interface IReviewNotifierService {
    /**
     * Tells the recipients: one websocket frame each (connections of the current tenant only,
     * R188) and one call per transport the step lists (R186). Never rejects and never reports a
     * failure (R196): every failure is logged once and the rest still goes out.
     */
    notify(params: ReviewNotifyParams): Promise<void>;
}

/** Delivers one review notification. Internal (D132): no permission check. */
export const ReviewNotifierService =
    createAbstraction<IReviewNotifierService>("ReviewNotifierService");

export namespace ReviewNotifierService {
    export type Interface = IReviewNotifierService;
    export type Params = ReviewNotifyParams;
}
```

Create `packages/api-workflows/src/features/notifications/ReviewNotifierService/ReviewNotifierService.ts`:

```ts
import type { NonEmptyArray } from "@webiny/api/types.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import {
    WebsocketsListConnectionsUseCase,
    WebsocketsSendToConnectionsUseCase
} from "@webiny/api-websockets/exports/api.js";
import {
    NOTIFICATION_SEND_CONCURRENCY,
    WORKFLOWS_NOTIFICATION_WEBSOCKET_ACTION
} from "~/domain/notifications/constants.js";
import { getErrorLogFields } from "~/domain/notifications/getErrorLogFields.js";
import type { WorkflowNotificationWebsocketData } from "~/domain/notifications/types.js";
import { NotificationTransport } from "~/features/notifications/NotificationTransport/abstractions.js";
import { NotificationRecipientService } from "~/features/notifications/NotificationRecipientService/abstractions.js";
import { ReviewTargetLinkService } from "~/features/notifications/ReviewTargetLinkService/abstractions.js";
import { ReviewNotifierService as Abstraction } from "./abstractions.js";

const WEBSOCKET_TEXT = "Could not send a workflow websocket notification.";
const LOOKUP_TEXT = "Could not look up the users to e-mail.";
const TRANSPORT_TEXT = "Could not send a workflow notification through a transport.";
const UNKNOWN_TRANSPORT_TEXT = "A step names a notification transport that is not registered.";

class ReviewNotifierServiceImpl implements Abstraction.Interface {
    public constructor(
        private listConnections: WebsocketsListConnectionsUseCase.Interface,
        private sendToConnections: WebsocketsSendToConnectionsUseCase.Interface,
        private tenantContext: TenantContext.Interface,
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

        // ---- Websocket (R187, R188, R197) ------------------------------------------------------
        // A recipient without an id never reaches the list use case: `identityId: ""` would list
        // every connection.
        const addressable = recipients.filter(item => typeof item.id === "string" && item.id !== "");
        if (addressable.length > 0) {
            let tenantId: string | undefined;
            let tenantError: unknown;
            try {
                tenantId = this.tenantContext.getTenant()?.id;
            } catch (error) {
                tenantError = error;
            }

            if (typeof tenantId !== "string" || tenantId === "") {
                // No current tenant: nothing is sent (a frame must never leave the review's
                // tenant), once for all recipients.
                this.logger.error(
                    { ...getErrorLogFields(tenantError), reviewId: review.id, event },
                    WEBSOCKET_TEXT
                );
            } else {
                const currentTenantId = tenantId;
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

                for (
                    let start = 0;
                    start < addressable.length;
                    start += NOTIFICATION_SEND_CONCURRENCY
                ) {
                    const batch = addressable.slice(start, start + NOTIFICATION_SEND_CONCURRENCY);
                    await Promise.all(
                        batch.map(async recipient => {
                            try {
                                const listed = await this.listConnections.execute({
                                    where: { identityId: recipient.id }
                                });
                                if (listed.isFail()) {
                                    this.logger.error(
                                        {
                                            ...getErrorLogFields(listed.error),
                                            errorMessage: listed.error.message,
                                            reviewId: review.id,
                                            event,
                                            recipientId: recipient.id
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
                                    action: WORKFLOWS_NOTIFICATION_WEBSOCKET_ACTION,
                                    data
                                });
                                if (sent.isFail()) {
                                    this.logger.error(
                                        {
                                            ...getErrorLogFields(sent.error),
                                            errorMessage: sent.error.message,
                                            reviewId: review.id,
                                            event,
                                            recipientId: recipient.id
                                        },
                                        WEBSOCKET_TEXT
                                    );
                                }
                            } catch (error) {
                                this.logger.error(
                                    {
                                        ...getErrorLogFields(error),
                                        errorMessage:
                                            error instanceof Error ? error.message : undefined,
                                        reviewId: review.id,
                                        event,
                                        recipientId: recipient.id
                                    },
                                    WEBSOCKET_TEXT
                                );
                            }
                        })
                    );
                }
            }
        }

        // ---- Transports (R186, R192, R193, R194, R195) -----------------------------------------
        try {
            const step = stepId === null ? undefined : review.steps.find(item => item.id === stepId);
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
        WebsocketsListConnectionsUseCase,
        WebsocketsSendToConnectionsUseCase,
        TenantContext,
        [NotificationTransport, { multiple: true }],
        NotificationRecipientService,
        ReviewTargetLinkService,
        Logger
    ]
});
```

Create `packages/api-workflows/src/features/notifications/ReviewNotifierService/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { ReviewNotifierService } from "./ReviewNotifierService.js";

export const ReviewNotifierServiceFeature = createFeature({
    name: "WorkflowNotifications/ReviewNotifierService",
    register(container) {
        container.register(ReviewNotifierService);
    }
});
```

Create `packages/api-workflows/src/features/notifications/ReviewNotifierService/index.ts`:

```ts
export { ReviewNotifierServiceFeature } from "./feature.js";
export { ReviewNotifierService } from "./abstractions.js";
export type { IReviewNotifierService, ReviewNotifyParams } from "./abstractions.js";
```

- [ ] **Step 4: Run the tests to see them pass**

`yarn test packages/api-workflows/__tests__/notifications/getErrorLogFields.test.ts 2>&1 | tail -50`
Expected: PASS.

`yarn test packages/api-workflows/__tests__/notifications/ReviewNotifierService.test.ts 2>&1 | tail -50`
Expected: PASS.

`yarn test:os packages/api-workflows/__tests__/notifications/ReviewNotifierService.test.ts 2>&1 | tail -50`
Expected: PASS.

The test file imports the `~tests/__helpers/FaultyTenantContext.js` helper from Task 8. If the websocket data keys test fails with an extra key, remove the key from the notifier: the contract is exactly R187.

- [ ] **Step 5: Run the existing tests covering the changed code**

The e-mail transport test now uses the shared `RecordingMailer`:
`yarn test packages/api-workflows/__tests__/notifications/MailNotificationTransport.test.ts 2>&1 | tail -50` and the same with `yarn test:os`.
Expected: PASS.

The registration test and the test handler are unchanged here (Task 12 registers the feature); the package gained a dependency, so confirm the container still builds:
`yarn test packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50` and the same with `yarn test:os`.
Expected: PASS.

Run: `yarn check:test:types -p api-workflows --report cli 2>&1 | tail -40`
Expected: no errors in the touched packages. (If the type check says the `WorkflowNotificationWebsocketData` interface is not assignable to `GenericRecord` in the `execute` call, widen the data once at the call site with `data: { ...data }`; the runtime frame is identical.)

- [ ] **Step 6: Pre-commit chain and commit**

Run the Global Constraints pre-commit chain from `00-shared.md` in full, building each changed package (`@webiny/api-workflows`) with `--no-cache`, and restore `.gitleaks.toml` (`git checkout -- .gitleaks.toml`). `yarn adio` must accept `@webiny/api-websockets` (it is imported by source) and `yarn webiny sync-dependencies` must leave `package.json`, the tsconfig files and the references consistent. If any step fails and you fix something, rerun the chain from the start. Then commit:

```
git commit -m "feat(api-workflows): add the review notifier service with websocket and transport delivery" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01EWvjsBXWqViJPTrgbzhYr4"
```
