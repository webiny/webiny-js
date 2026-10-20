### Task 6: Message builders, `getActorName`, `dropActor`, `clampComment`, constants and types

Spec 12; D44, D107, D111, D126, D133; R184, R187, R189, R189a, R197, R200; A62; Review Focus 2 (naming, `dropActor` semantics) and 3 (what a message may contain). Everything in this task is a pure function or a constant: no dependency, no I/O, no container.

- `domain/notifications/constants.ts` holds four constants: `WORKFLOWS_NOTIFICATION_WEBSOCKET_ACTION = "workflows.notification"` (R187), `NOTIFICATION_SEND_CONCURRENCY = 10` (R197), `NOTIFICATION_COMMENT_MAX_LENGTH = 300` (R189a) and `MAIL_BCC_CHUNK_SIZE = 50` (R193; Task 3 created the file with this one, this task appends the other three).
- `domain/notifications/types.ts` (created by Task 1 with `NotificationTransportInfo`) gains `WorkflowNotificationEvent`, `NotificationMessage` and `WorkflowNotificationWebsocketData` exactly as R187 and R189 state them.
- `getActorName(actor, stepTitle)` (R189a, D107, D126): the display name of a `user` actor (a blank name reads `A user`), the step title for `ai` and `automation`. An automation's or a model's own name is never returned.
- `dropActor(recipients, actor)` (R184): drops the recipient whose id equals `actor.id` only when `actor.type === "user"`. An `ai` or `automation` actor carries the requester's id (D58), so it never drops anyone. It returns a new array and does not touch the input. The decision "`stepFailed` never drops anyone" is the handler's: it does not call `dropActor` (Task 12).
- `clampComment(comment)` (R189a): trims, and cuts a comment longer than `NOTIFICATION_COMMENT_MAX_LENGTH` code points so that the result, including the appended `…`, is at most 300 code points. Counted by code point, so an emoji is never split.
- One pure builder per row of the R189 table in `domain/notifications/messages/`, each with its own named params interface and each returning `NotificationMessage { title, body, subject, text, linkLabel }`. Callers (Tasks 11-12) resolve every name and the assignment reason (`getAssignmentReason`) before the call, so a builder holds only the texts. Every person name shown (`requester`, `newOwner`, `canceller`, `taker`, `decider`, `operator`, `reassignedBy`) goes through `getActorName` with the actor, never a raw `displayName`, so a blank name reads `A user` (D107, R189a): Tasks 11-12 pass actors to `getActorName`. `linkLabel` is `Open content` in every message (A62: every link opens the content). The strings use the typographic quotes `“ ”` and the apostrophe `’` exactly as R189 prints them. No escaping happens here (it is the transport's job, R193): `<`, quotes and newlines pass through.
- `buildRejectedMessage` always has a comment (D100): one text, clamped through `clampComment`. `buildCancelledMessage` switches on `REVIEW_CANCEL_REASON_CONTENT_TRASHED` and `REVIEW_CANCEL_REASON_CONTENT_DELETED` (`~/domain/review/getDeleteCancelReason.js`); `null` and every other reason give the `Cancelled by {canceller}` text, and an unknown reason is never printed (R146 mirror).
- `getAssignmentReason(source, requesterName)` (R189a): `picked` is `picked by {requesterName}`, `rule` is `assigned by a routing rule`, `roundRobin` is `assigned by round-robin`, `leastLoaded` is `assigned by least-loaded`, anything else (including `null` and `undefined`) is `assigned to you`.

**Files:**
- Modify: `packages/api-workflows/src/domain/notifications/constants.ts` (created by Task 3 with `MAIL_BCC_CHUNK_SIZE`)
- Modify: `packages/api-workflows/src/domain/notifications/types.ts` (created by Task 1)
- Create: `packages/api-workflows/src/domain/notifications/getActorName.ts`
- Create: `packages/api-workflows/src/domain/notifications/dropActor.ts`
- Create: `packages/api-workflows/src/domain/notifications/clampComment.ts`
- Create: `packages/api-workflows/src/domain/notifications/messages/getAssignmentReason.ts`
- Create: `packages/api-workflows/src/domain/notifications/messages/buildPoolReachedMessage.ts`
- Create: `packages/api-workflows/src/domain/notifications/messages/buildAssignedMessage.ts`
- Create: `packages/api-workflows/src/domain/notifications/messages/buildReassignedMessage.ts`
- Create: `packages/api-workflows/src/domain/notifications/messages/buildTakenOverMessage.ts`
- Create: `packages/api-workflows/src/domain/notifications/messages/buildApprovedMessage.ts`
- Create: `packages/api-workflows/src/domain/notifications/messages/buildRejectedMessage.ts`
- Create: `packages/api-workflows/src/domain/notifications/messages/buildFailedMessage.ts`
- Create: `packages/api-workflows/src/domain/notifications/messages/buildCancelledMessage.ts`
- Create: `packages/api-workflows/__tests__/notifications/notificationConstants.test.ts`
- Create: `packages/api-workflows/__tests__/notifications/getActorName.test.ts`
- Create: `packages/api-workflows/__tests__/notifications/dropActor.test.ts`
- Create: `packages/api-workflows/__tests__/notifications/clampComment.test.ts`
- Create: `packages/api-workflows/__tests__/notifications/messages.test.ts`

**Interfaces:**
- Consumes:
  - Task 1: `packages/api-workflows/src/domain/notifications/types.ts` exists (it holds `NotificationTransportInfo`); this task appends to it.
  - Task 3: `packages/api-workflows/src/domain/notifications/constants.ts` exists with `export const MAIL_BCC_CHUNK_SIZE = 50;`; this task appends to it.
  - Existing: `Actor`, `ActorType` (`~/domain/review/types.js`), `AssignmentSource` (`~/domain/assignment/types.js`), `REVIEW_CANCEL_REASON_CONTENT_TRASHED` and `REVIEW_CANCEL_REASON_CONTENT_DELETED` (`~/domain/review/getDeleteCancelReason.js`), `requester`, `reviewer`, `aiActor` (`~tests/__helpers/fixtures.js`).
- Produces (matches the contract; the params interface names and field names are fixed here, Tasks 11-12 use them):
  - `constants.ts`: `WORKFLOWS_NOTIFICATION_WEBSOCKET_ACTION`, `NOTIFICATION_SEND_CONCURRENCY`, `NOTIFICATION_COMMENT_MAX_LENGTH`, `MAIL_BCC_CHUNK_SIZE`.
  - `types.ts`: `WorkflowNotificationEvent`, `NotificationMessage`, `WorkflowNotificationWebsocketData`.
  - `getActorName(actor: Actor, stepTitle: string): string`, `dropActor<T extends { id: string }>(recipients: T[], actor: Actor): T[]`, `clampComment(comment: string): string`.
  - `getAssignmentReason(source: AssignmentSource | null | undefined, requesterName: string): string`.
  - `buildPoolReachedMessage(params: PoolReachedMessageParams)` with `{ contentTitle, stepTitle, requester }`.
  - `buildAssignedMessage(params: AssignedMessageParams)` with `{ contentTitle, stepTitle, reason: string | null, reassignedBy: string | null }` (when `reassignedBy` is not `null` the body is the reassign variant and `reason` is ignored; a `null` reason reads `assigned to you`).
  - `buildReassignedMessage(params: ReassignedMessageParams)` with `{ contentTitle, stepTitle, operator, newOwner }`.
  - `buildTakenOverMessage(params: TakenOverMessageParams)` with `{ contentTitle, stepTitle, taker }`.
  - `buildApprovedMessage(params: ApprovedMessageParams)` with `{ contentTitle }`.
  - `buildRejectedMessage(params: RejectedMessageParams)` with `{ contentTitle, stepTitle, decider, comment }`.
  - `buildFailedMessage(params: FailedMessageParams)` with `{ contentTitle, stepTitle, reason }`.
  - `buildCancelledMessage(params: CancelledMessageParams)` with `{ contentTitle, stepTitle, canceller, reason: string | null }`.
  - Every builder file exports its function and its params interface, and each lives in `packages/api-workflows/src/domain/notifications/messages/<functionName>.ts`.

- [ ] **Step 1: Write the failing tests**

Create `packages/api-workflows/__tests__/notifications/notificationConstants.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
    MAIL_BCC_CHUNK_SIZE,
    NOTIFICATION_COMMENT_MAX_LENGTH,
    NOTIFICATION_SEND_CONCURRENCY,
    WORKFLOWS_NOTIFICATION_WEBSOCKET_ACTION
} from "~/domain/notifications/constants.js";

describe("notification constants (R187, R189a, R193, R197)", () => {
    it("holds the values the contract names", () => {
        expect(WORKFLOWS_NOTIFICATION_WEBSOCKET_ACTION).toBe("workflows.notification");
        expect(NOTIFICATION_SEND_CONCURRENCY).toBe(10);
        expect(NOTIFICATION_COMMENT_MAX_LENGTH).toBe(300);
        expect(MAIL_BCC_CHUNK_SIZE).toBe(50);
    });
});
```

Create `packages/api-workflows/__tests__/notifications/getActorName.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { getActorName } from "~/domain/notifications/getActorName.js";
import type { Actor } from "~/domain/review/types.js";

describe("getActorName (D107, D126, R189a)", () => {
    it("is the display name of a user", () => {
        const actor: Actor = { type: "user", id: "user-1", displayName: "Rob Reviewer" };

        expect(getActorName(actor, "Legal review")).toBe("Rob Reviewer");
    });

    it("reads 'A user' for a blank or whitespace-only user name", () => {
        const blank: Actor = { type: "user", id: "user-1", displayName: "" };
        const spaces: Actor = { type: "user", id: "user-1", displayName: "   " };

        expect(getActorName(blank, "Legal review")).toBe("A user");
        expect(getActorName(spaces, "Legal review")).toBe("A user");
    });

    it("trims the display name of a user", () => {
        const actor: Actor = { type: "user", id: "user-1", displayName: "  Rob Reviewer " };

        expect(getActorName(actor, "Legal review")).toBe("Rob Reviewer");
    });

    it("is the step title for an AI actor, never the model's name (D107)", () => {
        const actor: Actor = { type: "ai", id: "user-requester", displayName: "claude-sonnet-5" };

        expect(getActorName(actor, "Brand check")).toBe("Brand check");
    });

    it("is the step title for an automation actor, never the automation's name (D126)", () => {
        const actor: Actor = {
            type: "automation",
            id: "user-requester",
            displayName: "Link checker v2"
        };

        expect(getActorName(actor, "Check links")).toBe("Check links");
    });
});
```

Create `packages/api-workflows/__tests__/notifications/dropActor.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { dropActor } from "~/domain/notifications/dropActor.js";
import { aiActor, requester, reviewer } from "~tests/__helpers/fixtures.js";
import type { Actor } from "~/domain/review/types.js";

interface Recipient {
    id: string;
    displayName: string;
}

const RITA: Recipient = { id: requester.id, displayName: requester.displayName };
const ROB: Recipient = { id: reviewer.id, displayName: reviewer.displayName };

describe("dropActor (R184)", () => {
    it("drops the recipient who is the acting user", () => {
        expect(dropActor([RITA, ROB], reviewer)).toEqual([RITA]);
    });

    it("keeps everybody when the acting user is not a recipient", () => {
        expect(dropActor([RITA], reviewer)).toEqual([RITA]);
    });

    it("keeps the requester when an AI actor carries the requester's id (D58)", () => {
        expect(aiActor.id).toBe(requester.id);

        expect(dropActor([RITA, ROB], aiActor)).toEqual([RITA, ROB]);
    });

    it("keeps the requester when an automation actor carries the requester's id (D58)", () => {
        const automation: Actor = {
            type: "automation",
            id: requester.id,
            displayName: "Link checker"
        };

        expect(dropActor([RITA, ROB], automation)).toEqual([RITA, ROB]);
    });

    it("drops the requester when the requester acts as a user", () => {
        expect(dropActor([RITA, ROB], requester)).toEqual([ROB]);
    });

    it("returns a new array and leaves the input alone", () => {
        const recipients = [RITA, ROB];

        const kept = dropActor(recipients, aiActor);
        const dropped = dropActor(recipients, reviewer);

        expect(kept).not.toBe(recipients);
        expect(dropped).not.toBe(recipients);
        expect(recipients).toEqual([RITA, ROB]);
    });

    it("keeps the shape of the recipients", () => {
        const withExtra = [{ id: "user-1", displayName: "One", extra: true }];

        const kept = dropActor(withExtra, reviewer);

        expect(kept[0].extra).toBe(true);
    });

    it("returns an empty list for no recipients", () => {
        expect(dropActor([], reviewer)).toEqual([]);
    });
});
```

Create `packages/api-workflows/__tests__/notifications/clampComment.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { clampComment } from "~/domain/notifications/clampComment.js";
import { NOTIFICATION_COMMENT_MAX_LENGTH } from "~/domain/notifications/constants.js";

describe("clampComment (R189a)", () => {
    it("leaves a short comment alone", () => {
        expect(clampComment("The hero image is missing alt text.")).toBe(
            "The hero image is missing alt text."
        );
    });

    it("trims the comment", () => {
        expect(clampComment("  Fix the title.\n")).toBe("Fix the title.");
    });

    it("leaves a comment of exactly the maximum length alone", () => {
        const comment = "a".repeat(NOTIFICATION_COMMENT_MAX_LENGTH);

        expect(clampComment(comment)).toBe(comment);
    });

    it("cuts a longer comment so the result, with the ellipsis, is the maximum length", () => {
        const comment = "a".repeat(NOTIFICATION_COMMENT_MAX_LENGTH + 1);

        const clamped = clampComment(comment);

        expect(clamped).toBe(`${"a".repeat(NOTIFICATION_COMMENT_MAX_LENGTH - 1)}…`);
        expect(Array.from(clamped)).toHaveLength(NOTIFICATION_COMMENT_MAX_LENGTH);
    });

    it("drops the whitespace left at the cut before the ellipsis", () => {
        const comment = `${"a".repeat(NOTIFICATION_COMMENT_MAX_LENGTH - 3)}   ${"b".repeat(50)}`;

        expect(clampComment(comment)).toBe(`${"a".repeat(NOTIFICATION_COMMENT_MAX_LENGTH - 3)}…`);
    });

    it("counts code points and never splits an emoji", () => {
        const comment = `${"a".repeat(NOTIFICATION_COMMENT_MAX_LENGTH - 2)}😀😀😀`;

        const clamped = clampComment(comment);

        expect(clamped).toBe(`${"a".repeat(NOTIFICATION_COMMENT_MAX_LENGTH - 2)}😀…`);
        expect(Array.from(clamped)).toHaveLength(NOTIFICATION_COMMENT_MAX_LENGTH);
    });

    it("leaves newlines and markup in the comment alone (escaping is the transport's job)", () => {
        expect(clampComment('Line one\n<b>"two"</b>')).toBe('Line one\n<b>"two"</b>');
    });
});
```

Create `packages/api-workflows/__tests__/notifications/messages.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { NotificationMessage } from "~/domain/notifications/types.js";
import { buildPoolReachedMessage } from "~/domain/notifications/messages/buildPoolReachedMessage.js";
import { buildAssignedMessage } from "~/domain/notifications/messages/buildAssignedMessage.js";
import { buildReassignedMessage } from "~/domain/notifications/messages/buildReassignedMessage.js";
import { buildTakenOverMessage } from "~/domain/notifications/messages/buildTakenOverMessage.js";
import { buildApprovedMessage } from "~/domain/notifications/messages/buildApprovedMessage.js";
import { buildRejectedMessage } from "~/domain/notifications/messages/buildRejectedMessage.js";
import { buildFailedMessage } from "~/domain/notifications/messages/buildFailedMessage.js";
import { buildCancelledMessage } from "~/domain/notifications/messages/buildCancelledMessage.js";
import { getAssignmentReason } from "~/domain/notifications/messages/getAssignmentReason.js";
import { NOTIFICATION_COMMENT_MAX_LENGTH } from "~/domain/notifications/constants.js";
import {
    REVIEW_CANCEL_REASON_CONTENT_DELETED,
    REVIEW_CANCEL_REASON_CONTENT_TRASHED
} from "~/domain/review/getDeleteCancelReason.js";
import type { AssignmentSource } from "~/domain/assignment/types.js";

const CONTENT = "Launch page";
const STEP = "Legal review";

describe("buildPoolReachedMessage (R189)", () => {
    it("builds the pool text", () => {
        const message = buildPoolReachedMessage({
            contentTitle: CONTENT,
            stepTitle: STEP,
            requester: "Rita Requester"
        });

        expect(message).toEqual({
            title: "“Launch page” is waiting in the team pool",
            body: "Legal review · requested by Rita Requester",
            subject: "Team pool: Launch page (Legal review)",
            text: "“Legal review” is waiting in the team pool. Anyone in the team can start it.",
            linkLabel: "Open content"
        });
    });
});

describe("buildAssignedMessage (R189)", () => {
    it("builds the reached text with the resolved reason", () => {
        const message = buildAssignedMessage({
            contentTitle: CONTENT,
            stepTitle: STEP,
            reason: "picked by Rita Requester",
            reassignedBy: null
        });

        expect(message).toEqual({
            title: "You’re reviewing “Launch page”",
            body: "Legal review · picked by Rita Requester",
            subject: "You’re reviewing: Launch page (Legal review)",
            text: "You are the owner of Legal review. Open the content to approve or reject it.",
            linkLabel: "Open content"
        });
    });

    it("builds the reassign variant for the new owner, ignoring the reason", () => {
        const message = buildAssignedMessage({
            contentTitle: CONTENT,
            stepTitle: STEP,
            reason: "assigned by round-robin",
            reassignedBy: "Eddie Editor"
        });

        expect(message).toEqual({
            title: "You’re reviewing “Launch page”",
            body: "Legal review · reassigned to you by Eddie Editor",
            subject: "You’re reviewing: Launch page (Legal review)",
            text: "You are the owner of Legal review. Open the content to approve or reject it.",
            linkLabel: "Open content"
        });
    });

    it("falls back to 'assigned to you' without a reason", () => {
        const message = buildAssignedMessage({
            contentTitle: CONTENT,
            stepTitle: STEP,
            reason: null,
            reassignedBy: null
        });

        expect(message.body).toBe("Legal review · assigned to you");
    });
});

describe("buildReassignedMessage (R189)", () => {
    it("builds the old owner's text", () => {
        const message = buildReassignedMessage({
            contentTitle: CONTENT,
            stepTitle: STEP,
            operator: "Eddie Editor",
            newOwner: "Rob Reviewer"
        });

        expect(message).toEqual({
            title: "“Launch page” was reassigned to Rob Reviewer",
            body: "Legal review · reassigned by Eddie Editor. You no longer own this step.",
            subject: "Reassigned: Launch page (Legal review)",
            text: "Eddie Editor reassigned this step to Rob Reviewer. You don’t need to review it any more.",
            linkLabel: "Open content"
        });
    });
});

describe("buildTakenOverMessage (D111, R189)", () => {
    it("builds the previous owner's text", () => {
        const message = buildTakenOverMessage({
            contentTitle: CONTENT,
            stepTitle: STEP,
            taker: "Olga Reviewer"
        });

        expect(message).toEqual({
            title: "Olga Reviewer took over Legal review on “Launch page”.",
            body: "You no longer own this step.",
            subject: "Taken over: Launch page (Legal review)",
            text: "Olga Reviewer took over Legal review on “Launch page”. You don’t need to review it any more.",
            linkLabel: "Open content"
        });
    });
});

describe("buildApprovedMessage (R189)", () => {
    it("builds the requester's text", () => {
        const message = buildApprovedMessage({ contentTitle: CONTENT });

        expect(message).toEqual({
            title: "“Launch page” was approved",
            body: "All steps approved. It’s ready to publish.",
            subject: "Approved: Launch page",
            text: "Every step approved this revision. It’s ready to publish.",
            linkLabel: "Open content"
        });
    });
});

describe("buildRejectedMessage (D100, D107, R189)", () => {
    it("builds one text with the comment", () => {
        const message = buildRejectedMessage({
            contentTitle: CONTENT,
            stepTitle: STEP,
            decider: "Rob Reviewer",
            comment: "The hero image is missing alt text."
        });

        expect(message).toEqual({
            title: "“Launch page” was rejected at Legal review",
            body: "Rob Reviewer: “The hero image is missing alt text.”. Create a new revision to fix it.",
            subject: "Rejected: Launch page (Legal review)",
            text: "Rob Reviewer rejected this revision at Legal review: “The hero image is missing alt text.”. This revision can’t be changed; create a new revision, fix it and request a new review.",
            linkLabel: "Open content"
        });
    });

    it("names an AI decider by what the caller passed (the step title, D107)", () => {
        const message = buildRejectedMessage({
            contentTitle: CONTENT,
            stepTitle: "Brand check",
            decider: "Brand check",
            comment: "The tone is off."
        });

        expect(message.body).toBe(
            "Brand check: “The tone is off.”. Create a new revision to fix it."
        );
    });

    it("clamps the comment the same way in the in-app and the transport text", () => {
        const long = "x".repeat(NOTIFICATION_COMMENT_MAX_LENGTH + 100);
        const clamped = `${"x".repeat(NOTIFICATION_COMMENT_MAX_LENGTH - 1)}…`;

        const message = buildRejectedMessage({
            contentTitle: CONTENT,
            stepTitle: STEP,
            decider: "Rob Reviewer",
            comment: long
        });

        expect(message.body).toContain(`“${clamped}”`);
        expect(message.text).toContain(`“${clamped}”`);
        expect(message.body).not.toContain(long);
        expect(message.text).not.toContain(long);
    });
});

describe("buildFailedMessage (R146, R189)", () => {
    it("builds the requester's text from the fixed reason", () => {
        const message = buildFailedMessage({
            contentTitle: CONTENT,
            stepTitle: "Check links",
            reason: "The automation could not be started."
        });

        expect(message).toEqual({
            title: "Check links failed on “Launch page”",
            body: "The automation could not be started. You can restart the step.",
            subject: "Step failed: Launch page (Check links)",
            text: "Check links hit a technical error. The automation could not be started. The review is paused at this step until it is restarted.",
            linkLabel: "Open content"
        });
    });
});

describe("buildCancelledMessage (D134, R189)", () => {
    it("builds the normal cancel text for a null reason", () => {
        const message = buildCancelledMessage({
            contentTitle: CONTENT,
            stepTitle: STEP,
            canceller: "Rita Requester",
            reason: null
        });

        expect(message).toEqual({
            title: "The review of “Launch page” was cancelled",
            body: "Cancelled by Rita Requester. You no longer need to review Legal review.",
            subject: "Review cancelled: Launch page",
            text: "Rita Requester cancelled this review. You don’t need to review Legal review any more.",
            linkLabel: "Open content"
        });
    });

    it("builds the trashed text for the content trashed reason", () => {
        const message = buildCancelledMessage({
            contentTitle: CONTENT,
            stepTitle: STEP,
            canceller: "Rita Requester",
            reason: REVIEW_CANCEL_REASON_CONTENT_TRASHED
        });

        expect(message).toEqual({
            title: "The review of “Launch page” was cancelled",
            body: "The content was moved to the trash. You no longer need to review Legal review.",
            subject: "Review cancelled: Launch page",
            text: "The content was moved to the trash, so this review was cancelled. You don’t need to review Legal review any more.",
            linkLabel: "Open content"
        });
    });

    it("builds the deleted text for the content deleted reason", () => {
        const message = buildCancelledMessage({
            contentTitle: CONTENT,
            stepTitle: STEP,
            canceller: "Rita Requester",
            reason: REVIEW_CANCEL_REASON_CONTENT_DELETED
        });

        expect(message).toEqual({
            title: "The review of “Launch page” was cancelled",
            body: "The content was deleted. You no longer need to review Legal review.",
            subject: "Review cancelled: Launch page",
            text: "The content was deleted, so this review was cancelled. You don’t need to review Legal review any more.",
            linkLabel: "Open content"
        });
    });

    it("falls back to the normal text for an unknown reason and never prints it (R146 mirror)", () => {
        const message = buildCancelledMessage({
            contentTitle: CONTENT,
            stepTitle: STEP,
            canceller: "Rita Requester",
            reason: "SECRET internal reason"
        });

        expect(message.body).toBe(
            "Cancelled by Rita Requester. You no longer need to review Legal review."
        );
        expect(JSON.stringify(message)).not.toContain("SECRET");
    });
});

describe("getAssignmentReason (R189a)", () => {
    it.each<[AssignmentSource | null | undefined, string]>([
        ["picked", "picked by Rita Requester"],
        ["rule", "assigned by a routing rule"],
        ["roundRobin", "assigned by round-robin"],
        ["leastLoaded", "assigned by least-loaded"],
        ["pool", "assigned to you"],
        ["poolStart", "assigned to you"],
        ["takeOver", "assigned to you"],
        ["reassign", "assigned to you"],
        [null, "assigned to you"],
        [undefined, "assigned to you"]
    ])("maps %s to %s", (source, expected) => {
        expect(getAssignmentReason(source, "Rita Requester")).toBe(expected);
    });
});

describe("message content (R189, R200)", () => {
    const messages = (): NotificationMessage[] => {
        return [
            buildPoolReachedMessage({ contentTitle: "<T>", stepTitle: "<S>", requester: "<R>" }),
            buildAssignedMessage({
                contentTitle: "<T>",
                stepTitle: "<S>",
                reason: "<reason>",
                reassignedBy: null
            }),
            buildAssignedMessage({
                contentTitle: "<T>",
                stepTitle: "<S>",
                reason: null,
                reassignedBy: "<O>"
            }),
            buildReassignedMessage({
                contentTitle: "<T>",
                stepTitle: "<S>",
                operator: "<O>",
                newOwner: "<N>"
            }),
            buildTakenOverMessage({ contentTitle: "<T>", stepTitle: "<S>", taker: "<K>" }),
            buildApprovedMessage({ contentTitle: "<T>" }),
            buildRejectedMessage({
                contentTitle: "<T>",
                stepTitle: "<S>",
                decider: "<D>",
                comment: "<C>"
            }),
            buildFailedMessage({ contentTitle: "<T>", stepTitle: "<S>", reason: "<F>." }),
            buildCancelledMessage({
                contentTitle: "<T>",
                stepTitle: "<S>",
                canceller: "<X>",
                reason: null
            })
        ];
    };

    it("has exactly the five contract fields and the same link label everywhere", () => {
        for (const message of messages()) {
            expect(Object.keys(message).sort()).toEqual([
                "body",
                "linkLabel",
                "subject",
                "text",
                "title"
            ]);
            expect(message.linkLabel).toBe("Open content");
        }
    });

    it("passes markup, quotes and newlines through unescaped (the transport escapes)", () => {
        const message = buildRejectedMessage({
            contentTitle: "<script>alert(1)</script>",
            stepTitle: 'Step "one"',
            decider: "Rob & Co",
            comment: "Line one\nLine two"
        });

        expect(message.title).toBe(
            "“<script>alert(1)</script>” was rejected at Step \"one\""
        );
        expect(message.body).toContain("Rob & Co: “Line one\nLine two”");
    });

    it("never holds an unresolved placeholder", () => {
        for (const message of messages()) {
            for (const value of Object.values(message)) {
                expect(value).not.toContain("undefined");
                expect(value).not.toContain("null");
                expect(value).not.toContain("[object");
                expect(value).not.toContain("{");
            }
        }
    });
});
```

- [ ] **Step 2: Run the tests to see them fail**

Run each file on its own (multi-path runs find no files):

`yarn test packages/api-workflows/__tests__/notifications/notificationConstants.test.ts 2>&1 | tail -50`
Expected: FAIL, the three new constants are `undefined` (`WORKFLOWS_NOTIFICATION_WEBSOCKET_ACTION` and the others are not exported).

`yarn test packages/api-workflows/__tests__/notifications/getActorName.test.ts 2>&1 | tail -50`
Expected: FAIL, `Cannot find module '~/domain/notifications/getActorName.js'` (the same for `dropActor.test.ts`, `clampComment.test.ts` and `messages.test.ts`, naming their missing module).

Run the same five files with `yarn test:os` (one at a time).
Expected: the same failures.

- [ ] **Step 3: Implement**

Append to `packages/api-workflows/src/domain/notifications/constants.ts`, after the `MAIL_BCC_CHUNK_SIZE` line Task 3 created. The file then holds these four exports (keep Task 3's exact line and comment for `MAIL_BCC_CHUNK_SIZE`):

```ts
/** The websocket action of every workflow notification (R187); the event is in `data`. */
export const WORKFLOWS_NOTIFICATION_WEBSOCKET_ACTION = "workflows.notification";

/** Recipients whose websocket send runs at the same time, in plain batches (R197). */
export const NOTIFICATION_SEND_CONCURRENCY = 10;

/** The rejection comment in a message is cut to this many characters, `…` included (R189a). */
export const NOTIFICATION_COMMENT_MAX_LENGTH = 300;

/** Recipients in one mail: `bcc` is chunked to this size (R193). */
export const MAIL_BCC_CHUNK_SIZE = 50;
```

Append to `packages/api-workflows/src/domain/notifications/types.ts`, after `NotificationTransportInfo` (Task 1):

```ts
/**
 * The events a recipient is told about (R187). Not the review fact names: `poolReached` and
 * `assigned` are the two shapes of `stepReached`.
 */
export type WorkflowNotificationEvent =
    | "poolReached"
    | "assigned"
    | "reassigned"
    | "takenOver"
    | "approved"
    | "rejected"
    | "failed"
    | "cancelled";

/**
 * One notification's texts (R189). `title` and `body` are the websocket (in-app) texts;
 * `subject`, `text` and `linkLabel` go to the transports (`subject` is the transport message
 * `title`, `text` its `body`). Plain text: escaping is the transport's job.
 */
export interface NotificationMessage {
    title: string;
    body: string;
    subject: string;
    text: string;
    linkLabel: string;
}

/**
 * The `data` of the `workflows.notification` websocket action (R187). Ids, the namespace and the
 * in-app texts only (R200); `stepId` is `null` only for a cancel with no step, which notifies
 * nobody.
 */
export interface WorkflowNotificationWebsocketData {
    event: WorkflowNotificationEvent;
    reviewId: string;
    stepId: string | null;
    /** `review.model`: the client opens the CMS or Website Builder app by it (D133). */
    namespace: string;
    targetId: string;
    targetRevisionId: string;
    title: string;
    body: string;
}
```

Create `packages/api-workflows/src/domain/notifications/getActorName.ts`:

```ts
import type { Actor } from "~/domain/review/types.js";

/**
 * How a message names an actor (D107, D126, R189a): a person by their display name (a blank name
 * reads "A user"), an AI step or an automation by the step title, never by the model's or the
 * automation's own name. Pure.
 */
export const getActorName = (actor: Actor, stepTitle: string): string => {
    if (actor.type !== "user") {
        return stepTitle;
    }
    const name = actor.displayName.trim();
    return name === "" ? "A user" : name;
};
```

Create `packages/api-workflows/src/domain/notifications/dropActor.ts`:

```ts
import type { Actor } from "~/domain/review/types.js";

/**
 * Nobody is told about their own action (R184), but only a person's. An AI or an automation actor
 * carries the requester's id (D58), so it never drops the requester: the requester still hears
 * that the AI rejected the review. Returns a new array. Pure.
 */
export const dropActor = <T extends { id: string }>(recipients: T[], actor: Actor): T[] => {
    if (actor.type !== "user") {
        return [...recipients];
    }
    return recipients.filter(recipient => recipient.id !== actor.id);
};
```

Create `packages/api-workflows/src/domain/notifications/clampComment.ts`:

```ts
import { NOTIFICATION_COMMENT_MAX_LENGTH } from "~/domain/notifications/constants.js";

/**
 * The rejection comment as a message shows it (R189a): trimmed, and cut so that the result,
 * including the appended `…`, is at most `NOTIFICATION_COMMENT_MAX_LENGTH` code points. Counted by
 * code point, so an emoji is never split. Pure.
 */
export const clampComment = (comment: string): string => {
    const trimmed = comment.trim();
    const characters = Array.from(trimmed);
    if (characters.length <= NOTIFICATION_COMMENT_MAX_LENGTH) {
        return trimmed;
    }
    const kept = characters.slice(0, NOTIFICATION_COMMENT_MAX_LENGTH - 1).join("");
    return `${kept.trimEnd()}…`;
};
```

Create `packages/api-workflows/src/domain/notifications/messages/getAssignmentReason.ts`:

```ts
import type { AssignmentSource } from "~/domain/assignment/types.js";

/**
 * The `{reason}` of an `assigned` message (R189a). `rule` carries no rule name (A62: a rule id is
 * not a name); a pool start, take over, reassign or a missing source reads "assigned to you".
 * Pure.
 */
export const getAssignmentReason = (
    source: AssignmentSource | null | undefined,
    requesterName: string
): string => {
    switch (source) {
        case "picked":
            return `picked by ${requesterName}`;
        case "rule":
            return "assigned by a routing rule";
        case "roundRobin":
            return "assigned by round-robin";
        case "leastLoaded":
            return "assigned by least-loaded";
        default:
            return "assigned to you";
    }
};
```

Create `packages/api-workflows/src/domain/notifications/messages/buildPoolReachedMessage.ts`:

```ts
import type { NotificationMessage } from "~/domain/notifications/types.js";

export interface PoolReachedMessageParams {
    /** `review.title`. */
    contentTitle: string;
    stepTitle: string;
    /** `review.createdBy.displayName`. */
    requester: string;
}

/** A step reached the team pool (R189, `poolReached`). */
export const buildPoolReachedMessage = (params: PoolReachedMessageParams): NotificationMessage => {
    const { contentTitle, stepTitle, requester } = params;
    return {
        title: `“${contentTitle}” is waiting in the team pool`,
        body: `${stepTitle} · requested by ${requester}`,
        subject: `Team pool: ${contentTitle} (${stepTitle})`,
        text: `“${stepTitle}” is waiting in the team pool. Anyone in the team can start it.`,
        linkLabel: "Open content"
    };
};
```

Create `packages/api-workflows/src/domain/notifications/messages/buildAssignedMessage.ts`:

```ts
import type { NotificationMessage } from "~/domain/notifications/types.js";

export interface AssignedMessageParams {
    /** `review.title`. */
    contentTitle: string;
    stepTitle: string;
    /**
     * Why the step is the recipient's, already resolved by `getAssignmentReason`. Used when
     * `reassignedBy` is `null`; `null` reads "assigned to you".
     */
    reason: string | null;
    /**
     * The name of who reassigned the step to the recipient (`getActorName`), or `null` when the
     * step was reached by routing.
     */
    reassignedBy: string | null;
}

/** A user owns a step: reached by routing or reassigned to them (R189, `assigned`). */
export const buildAssignedMessage = (params: AssignedMessageParams): NotificationMessage => {
    const { contentTitle, stepTitle, reason, reassignedBy } = params;
    const why =
        reassignedBy !== null
            ? `reassigned to you by ${reassignedBy}`
            : (reason ?? "assigned to you");
    return {
        title: `You’re reviewing “${contentTitle}”`,
        body: `${stepTitle} · ${why}`,
        subject: `You’re reviewing: ${contentTitle} (${stepTitle})`,
        text: `You are the owner of ${stepTitle}. Open the content to approve or reject it.`,
        linkLabel: "Open content"
    };
};
```

Create `packages/api-workflows/src/domain/notifications/messages/buildReassignedMessage.ts`:

```ts
import type { NotificationMessage } from "~/domain/notifications/types.js";

export interface ReassignedMessageParams {
    /** `review.title`. */
    contentTitle: string;
    stepTitle: string;
    /** Who reassigned (`getActorName`). */
    operator: string;
    /** The new owner's display name. */
    newOwner: string;
}

/** The old owner of a reassigned step (R189, `reassigned`). */
export const buildReassignedMessage = (params: ReassignedMessageParams): NotificationMessage => {
    const { contentTitle, stepTitle, operator, newOwner } = params;
    return {
        title: `“${contentTitle}” was reassigned to ${newOwner}`,
        body: `${stepTitle} · reassigned by ${operator}. You no longer own this step.`,
        subject: `Reassigned: ${contentTitle} (${stepTitle})`,
        text: `${operator} reassigned this step to ${newOwner}. You don’t need to review it any more.`,
        linkLabel: "Open content"
    };
};
```

Create `packages/api-workflows/src/domain/notifications/messages/buildTakenOverMessage.ts`:

```ts
import type { NotificationMessage } from "~/domain/notifications/types.js";

export interface TakenOverMessageParams {
    /** `review.title`. */
    contentTitle: string;
    stepTitle: string;
    /** Who took the step over (`getActorName`). */
    taker: string;
}

/** The previous owner of a step somebody took over (D111, R189, `takenOver`). */
export const buildTakenOverMessage = (params: TakenOverMessageParams): NotificationMessage => {
    const { contentTitle, stepTitle, taker } = params;
    return {
        title: `${taker} took over ${stepTitle} on “${contentTitle}”.`,
        body: "You no longer own this step.",
        subject: `Taken over: ${contentTitle} (${stepTitle})`,
        text: `${taker} took over ${stepTitle} on “${contentTitle}”. You don’t need to review it any more.`,
        linkLabel: "Open content"
    };
};
```

Create `packages/api-workflows/src/domain/notifications/messages/buildApprovedMessage.ts`:

```ts
import type { NotificationMessage } from "~/domain/notifications/types.js";

export interface ApprovedMessageParams {
    /** `review.title`. */
    contentTitle: string;
}

/** The requester's review is approved by every step (R189, `approved`). */
export const buildApprovedMessage = (params: ApprovedMessageParams): NotificationMessage => {
    const { contentTitle } = params;
    return {
        title: `“${contentTitle}” was approved`,
        body: "All steps approved. It’s ready to publish.",
        subject: `Approved: ${contentTitle}`,
        text: "Every step approved this revision. It’s ready to publish.",
        linkLabel: "Open content"
    };
};
```

Create `packages/api-workflows/src/domain/notifications/messages/buildRejectedMessage.ts`:

```ts
import { clampComment } from "~/domain/notifications/clampComment.js";
import type { NotificationMessage } from "~/domain/notifications/types.js";

export interface RejectedMessageParams {
    /** `review.title`. */
    contentTitle: string;
    stepTitle: string;
    /** Who rejected (`getActorName`): a person's name, or the step title for AI and automation. */
    decider: string;
    /** The rejection comment; a reject always has one (D100). Clamped here (R189a). */
    comment: string;
}

/** The requester's review was rejected (D107, R189, `rejected`). */
export const buildRejectedMessage = (params: RejectedMessageParams): NotificationMessage => {
    const { contentTitle, stepTitle, decider } = params;
    const comment = clampComment(params.comment);
    return {
        title: `“${contentTitle}” was rejected at ${stepTitle}`,
        body: `${decider}: “${comment}”. Create a new revision to fix it.`,
        subject: `Rejected: ${contentTitle} (${stepTitle})`,
        text: `${decider} rejected this revision at ${stepTitle}: “${comment}”. This revision can’t be changed; create a new revision, fix it and request a new review.`,
        linkLabel: "Open content"
    };
};
```

Create `packages/api-workflows/src/domain/notifications/messages/buildFailedMessage.ts`:

```ts
import type { NotificationMessage } from "~/domain/notifications/types.js";

export interface FailedMessageParams {
    /** `review.title`. */
    contentTitle: string;
    stepTitle: string;
    /**
     * `fact.reason` of the failed step: a fixed text that already ends in a full stop (R146,
     * R170). The only error text a message may hold (R146 mirror).
     */
    reason: string;
}

/** An AI or automation step failed; the requester is told (R189, `failed`). */
export const buildFailedMessage = (params: FailedMessageParams): NotificationMessage => {
    const { contentTitle, stepTitle, reason } = params;
    return {
        title: `${stepTitle} failed on “${contentTitle}”`,
        body: `${reason} You can restart the step.`,
        subject: `Step failed: ${contentTitle} (${stepTitle})`,
        text: `${stepTitle} hit a technical error. ${reason} The review is paused at this step until it is restarted.`,
        linkLabel: "Open content"
    };
};
```

Create `packages/api-workflows/src/domain/notifications/messages/buildCancelledMessage.ts`:

```ts
import {
    REVIEW_CANCEL_REASON_CONTENT_DELETED,
    REVIEW_CANCEL_REASON_CONTENT_TRASHED
} from "~/domain/review/getDeleteCancelReason.js";
import type { NotificationMessage } from "~/domain/notifications/types.js";

export interface CancelledMessageParams {
    /** `review.title`. */
    contentTitle: string;
    stepTitle: string;
    /** Who cancelled (`getActorName`). */
    canceller: string;
    /**
     * `fact.reason` of the cancel: the trashed and deleted constants have their own text, `null`
     * and any other reason the normal one. The reason itself is never printed (R146 mirror).
     */
    reason: string | null;
}

/** The owner of a step whose review was cancelled (D134, R189, `cancelled`). */
export const buildCancelledMessage = (params: CancelledMessageParams): NotificationMessage => {
    const { contentTitle, stepTitle, canceller, reason } = params;
    const title = `The review of “${contentTitle}” was cancelled`;
    const subject = `Review cancelled: ${contentTitle}`;

    if (reason === REVIEW_CANCEL_REASON_CONTENT_TRASHED) {
        return {
            title,
            body: `The content was moved to the trash. You no longer need to review ${stepTitle}.`,
            subject,
            text: `The content was moved to the trash, so this review was cancelled. You don’t need to review ${stepTitle} any more.`,
            linkLabel: "Open content"
        };
    }
    if (reason === REVIEW_CANCEL_REASON_CONTENT_DELETED) {
        return {
            title,
            body: `The content was deleted. You no longer need to review ${stepTitle}.`,
            subject,
            text: `The content was deleted, so this review was cancelled. You don’t need to review ${stepTitle} any more.`,
            linkLabel: "Open content"
        };
    }
    return {
        title,
        body: `Cancelled by ${canceller}. You no longer need to review ${stepTitle}.`,
        subject,
        text: `${canceller} cancelled this review. You don’t need to review ${stepTitle} any more.`,
        linkLabel: "Open content"
    };
};
```

- [ ] **Step 4: Run the tests to see them pass**

Run each file on its own:
`yarn test packages/api-workflows/__tests__/notifications/notificationConstants.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/notifications/getActorName.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/notifications/dropActor.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/notifications/clampComment.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/notifications/messages.test.ts 2>&1 | tail -50`
Expected: PASS for each.

Run the same five files with `yarn test:os` (one at a time).
Expected: PASS.

- [ ] **Step 5: Run the existing tests covering the changed code**

`constants.ts` and `types.ts` also serve the e-mail transport and the transports list (Tasks 1 and 3):

`yarn test packages/api-workflows/__tests__/notifications/MailNotificationTransport.test.ts 2>&1 | tail -50` and the same with `yarn test:os`.
Expected: PASS.

`yarn test packages/api-workflows/__tests__/notifications/ListNotificationTransports.test.ts 2>&1 | tail -50` and the same with `yarn test:os`.
Expected: PASS.

Run: `yarn check:test:types -p api-workflows --report cli 2>&1 | tail -40`
Expected: no errors in the touched packages.

- [ ] **Step 6: Pre-commit chain and commit**

Run the Global Constraints pre-commit chain from `00-shared.md` in full, building each changed package (`@webiny/api-workflows`) with `--no-cache`, and restore `.gitleaks.toml` (`git checkout -- .gitleaks.toml`). If any step fails and you fix something, rerun the chain from the start. Then commit:

```
git commit -m "feat(api-workflows): add the workflow notification message builders and helpers" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01EWvjsBXWqViJPTrgbzhYr4"
```
