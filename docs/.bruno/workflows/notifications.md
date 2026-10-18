# Notification transports

A developer guide for review notifications: what is sent to whom, how to write and register a `NotificationTransport`, the message shape, escaping, the never-throw contract and logging without addresses. It is for developers who write a transport, not for workflow authors.

## 1. What a notification is and what a transport is

Review events notify their recipients (D44, R181, listed in section 8) through two channels: a `workflows.notification` websocket message, always (the silent `workflows.reviewChanged` of section 8 is separate), and the transports configured on the step where the event happened (D103, R186). The engine ships one transport, e-mail. A transport is a class you register; it receives the recipients and one message per event and delivers it somewhere (an e-mail, a chat webhook, an SMS).

The websocket message is not a transport and cannot be switched off (D96). Notifications are sent only when `advancedPublishingWorkflow` is on (R199): `ReviewNotificationsFeature` is registered by `WorkflowsFeature` inside that gate, together with the e-mail transport and the transports operation.

In production the API registers `WebsocketsFeature` and `MailerFeature` before `WorkflowsFeature` (`registerApiRequestStack.ts` in `@webiny/api-event-handler-core`). Any container that registers `WorkflowsFeature` must also provide `SendMailUseCase` (api-mailer; `MailerFeature` registers it together with `MailerService`, and it needs the event publisher) and the websocket list and send use cases (api-websockets), because the review event handlers are resolved on every publish; the default API stack (`registerApiRequestStack`) registers both before `WorkflowsFeature`. The mailer sends from the `from` of its settings when a mail names none (R201), so the e-mail transport sets no sender. The e-mail transport sends through `SendMailUseCase`: the mailer's validation applies to workflow e-mails (a failure is logged like any send failure), and the Mail before-send, after-send and send-error events fire, so user event handlers see them. Those handlers run inside the review action and are awaited, so a mail event handler must be quick; a throwing one is caught and logged and never fails the action.

## 2. The abstraction

`NotificationTransport` is exported from `@webiny/api-workflows/features/notifications/NotificationTransport/index.js` (the package `exports` map is `"./*": "./*"`, so any path under the package is importable). The same barrel exports the I-prefixed interfaces `INotificationTransport`, `INotificationTransportSendParams`, `INotificationTransportUser` and `INotificationTransportMessage`, and the namespace types `NotificationTransport.Interface`, `NotificationTransport.SendParams`, `NotificationTransport.User` and `NotificationTransport.Message` alias them.

Write your class against the namespace types (`implements NotificationTransport.Interface`), never an inline object type. A transport has:

- `id`: stable, stored on workflow steps as `notifications[{ id }]`. A rename breaks stored workflows. The e-mail transport is `"e-mail"`.
- `title`: shown in the editor's "Notify via" list.
- `description`: optional, shown next to the title.
- `send(params)`: delivers one message to a set of users.

The editor reads `id`, `title` and `description` through the shared `listNotificationTransports` operation (`editor` only, R191, D152), which lists every registered transport, sorted by title.

## 3. What `send` receives

`send` receives `{ users, message }`.

`users` is a non-empty array of `{ id, email, displayName }` exactly as the user store holds them. The engine does not clean or validate addresses (R194), so a transport decides what it can use. An external identity provider user can have its identity id as `email`. The e-mail transport keeps an address only if it has exactly one `@` with text on both sides and no whitespace, comma, semicolon or angle bracket, and sends an address that several users share once (R193).

`message` is `{ title, body, url, linkLabel }`:

- `title`: the subject line.
- `body`: plain text with `\n` line breaks.
- `url`: the admin link to the content (admin host from service discovery, the app's path and a `tenantId` query parameter holding the review's own tenant id), or `null` when there is no admin host, no link adapter for the app or no current tenant (R195).
- `linkLabel`: the text for the link (`Open content`).

There is no HTML: a transport that sends HTML escapes it itself. One `send` call per event and per transport carries every recipient (R197), and the text is the same for every recipient, so there is no per-recipient greeting (D44). Send blind (bcc) when the channel shows recipients to each other.

## 4. Escaping and user text

Titles, step titles, display names and the rejection comment are user text (R146 mirror, R200). Escape everything you put in markup (the engine's `escapeHtml` and `toSingleLine` in `domain/notifications/` are internal helpers: copy the idea, do not import a private path), keep header values on one line (the e-mail transport collapses CR, LF and whitespace runs in the subject, R193) and never build a URL from message text: use `message.url`.

## 5. Failure handling: `send` never throws

`send` returns `Promise<void>`. It catches, logs once with `Logger.error` and returns. A notification never fails a review action (R190, R196, R87): the saver publishes after the save and handler exceptions propagate, so an uncaught throw would fail an approve that already happened.

The engine wraps each transport call in its own try/catch as a last resort and logs `Could not send a workflow notification through a transport.` with the transport id, the review id, the event and the error's `code` and `name`. A transport must not rely on that. A failure of one transport does not stop the websocket message or the other transports. There is no retry and no queue (A64, A65): a notification that fails is lost, and the review state is the truth.

## 6. Logging: no addresses

Log with `Logger.error({ ... }, "<fixed text>")` using ids, the transport id and `error.code` and `error.name` only. Never log an address, the message, the error object or `error.message`: an SMTP or provider error often embeds the addresses it refused (R193, R196).

The e-mail transport is the reference. It logs `{ errorCode, errorName, userIds }` under `Could not send a workflow notification e-mail.` once per failed chunk, for a failed Result and for a throw alike.

Latency: `send` runs inside the user's request (A65), so keep it quick. Chunk big recipient lists (the e-mail transport sends one mail per 50 bcc recipients, `MAIL_BCC_CHUNK_SIZE`, and a failed chunk does not stop the next) and put a timeout on every network call.

## 7. Writing and registering a transport

A transport is registered as a class (`NotificationTransport.createImplementation({ implementation, dependencies })`) in a feature (`createFeature` from `@webiny/feature/api`, `container.register(...)`) that is registered in the project's API like any API feature. Use a new `id` for a new transport.

**Duplicate ids.** The notifier builds a `Map` of the resolved transports by id, so for two registrations with one `id` the last resolved one sends (override semantics). The editor list (`ListNotificationTransports`) maps every registration, so a duplicate id appears twice in "Notify via".

**Overriding the e-mail transport.** Register your class with id `"e-mail"` in a feature that is registered after `WorkflowsFeature`. `container.resolveAll` returns the parent container first, then `registerInstance` registrations, then class registrations, then factories, each in registration order (`Container.resolveMultiple` in `@webiny/di`). A class registered later is therefore last; an instance registration of the abstraction would come first and lose to any class.

**Choosing transports.** A workflow author picks transports per step in the editor and the choice is stored as the transport id. Ids are not validated when a workflow is saved. A transport unregistered later is skipped at send time and logged with `A step names a notification transport that is not registered.`; it never blocks editing or saving a workflow (R192). The editor lists the transports from `listNotificationTransports` as checkboxes; ids on a loaded step that are no longer listed are kept on save and not shown (D151, R272).

**Example.** A chat webhook transport. It reads its URL from the environment: credentials never go into the workflow step (the same rule as automations, R154).

```ts
import { createFeature } from "@webiny/feature/api";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { NotificationTransport } from "@webiny/api-workflows/features/notifications/NotificationTransport/index.js";

class ChatWebhookTransportImpl implements NotificationTransport.Interface {
    public readonly id = "chat-webhook";
    public readonly title = "Team chat";
    public readonly description = "Posts to the review channel in the team chat.";

    public constructor(private logger: Logger.Interface) {}

    public async send(params: NotificationTransport.SendParams): Promise<void> {
        const { users, message } = params;
        const userIds = users.map(user => user.id);
        const webhookUrl = process.env.WEBINY_CHAT_WEBHOOK_URL;
        if (!webhookUrl) {
            this.logger.error({ userIds }, "The team chat webhook is not configured.");
            return;
        }

        const text = message.url
            ? `${message.title}\n${message.body}\n${message.linkLabel}: ${message.url}`
            : `${message.title}\n${message.body}`;

        try {
            const response = await fetch(webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text }),
                signal: AbortSignal.timeout(5000)
            });
            if (!response.ok) {
                this.logger.error(
                    { status: response.status, userIds },
                    "Could not send a workflow notification to the team chat."
                );
            }
        } catch (error) {
            this.logger.error(
                { errorName: error instanceof Error ? error.name : undefined, userIds },
                "Could not send a workflow notification to the team chat."
            );
        }
    }
}

export const ChatWebhookTransport = NotificationTransport.createImplementation({
    implementation: ChatWebhookTransportImpl,
    dependencies: [Logger]
});

export const ChatWebhookTransportFeature = createFeature({
    name: "MyProject/ChatWebhookTransport",
    register(container) {
        container.register(ChatWebhookTransport);
    }
});
```

Test it by driving `send` directly with a fake `Logger`, a stubbed `fetch` that rejects and one that returns `ok: false`, and assert that it resolves and logs once without an address.

## 8. Who gets a notification, and what the message says

The events and recipients of the D44 table as built (R181, R183), one handler per event:

| Event | Recipients |
|---|---|
| Step reached, pool | The members of the step's candidate teams who may read the content and are not excluded, never the requester |
| Step reached, owner is a user (routing, pick) | The owner |
| Reassign | The new owner and the old owner, two messages |
| Take over | The previous owner, unless the taker opted out with `notifyPreviousOwner` (D111, R185) |
| Approved, rejected, failed | The requester |
| Cancelled | The owner of the step the review was on, if a user |

No `workflows.notification` is sent for requested, an intermediate approve, a pool start or a restart (the silent change message below covers them). AI and automation owners are never notified as owners (D58).

A person is never told about their own action (R184), but only a `user` actor's: an AI or automation actor carries the requester's id, so it never hides the requester's own notice, and a failed step always notifies the requester. A transport sees none of this: it receives the already-built message.

The texts (R189) name AI and automation deciders by their step title (D107, D126). The only free text in a message is the content title, the step title, a display name, the rejection comment (at most 300 characters) and a fixed failure reason (R200). A message has no field values, no model names and no team or rule names (A62).

The websocket message is the action `workflows.notification`, with the data keys of `WorkflowNotificationWebsocketData` (`domain/notifications/types.ts`): `event`, `reviewId`, `stepId`, `namespace`, `targetId`, `targetRevisionId`, `title` and `body`. It goes only to the recipient's connections in the review's own tenant, ten recipients at a time (R188, D149).

**The change message (D160, R253-R255).** Separate from notifications: `workflows.reviewChanged` is a second websocket action with no title, no body and no toast, so no transport sees it. The data keys of `WorkflowReviewChangedWebsocketData` (`domain/notifications/types.ts`) are `kind` (`requested`, `stepStarted`, `stepApproved` or `stepRestarted`), `reviewId`, `stepId` (null when the change belongs to no step), `namespace`, `targetId` and `targetRevisionId`. One handler per event (`Review<Event>ChangeNotifications`) sends it through `ReviewChangeNotifierService`; the `stepApproved` handler sends only while the review is still `inProgress`, because the final approval sends `approved`. The recipients (`getReviewChangeRecipients`) are the requester and the current user owner, de-duplicated, never the acting user. A failure sends no change message: its owner is AI or automation, and the requester gets the `failed` notification. There is no pool lookup. Delivery is the same tenant-scoped, ten-at-a-time, never-throwing sender as the notification messages (`ReviewWebsocketSender`). The admin refetches what shows that review.

## 9. Related

Spec 12; decisions D44, D60, D96, D103, D111, D129, D149-D156 and D160; `automations.md` and `ai-tools.md` for the other two extension points. The discovery files `api.md`, `infrastructure.md`, `app.md` and `integrations.md` are 2026-10-01 snapshots and still describe notifications as unsent.
