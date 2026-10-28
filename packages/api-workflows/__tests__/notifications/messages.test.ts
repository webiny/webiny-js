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

    it("words a rejection without a comment as one line when the decider is the step (D126)", () => {
        const message = buildRejectedMessage({
            contentTitle: CONTENT,
            stepTitle: "AI tone check",
            decider: "AI tone check",
            comment: null
        });

        expect(message.title).toBe("“Launch page” was rejected at AI tone check");
        expect(message.subject).toBe("Rejected: Launch page (AI tone check)");
        expect(message.body).toBe("Rejected at AI tone check.");
        expect(message.text).toBe("Rejected at AI tone check.");
    });

    it("names the person in a rejection without a comment (D126)", () => {
        const message = buildRejectedMessage({
            contentTitle: CONTENT,
            stepTitle: "Legal sign-off",
            decider: "Ana Kovač",
            comment: null
        });

        expect(message.body).toBe("Rejected at Legal sign-off by Ana Kovač.");
        expect(message.text).toBe("Rejected at Legal sign-off by Ana Kovač.");
    });

    it("treats a blank comment like null", () => {
        const message = buildRejectedMessage({
            contentTitle: CONTENT,
            stepTitle: "Legal sign-off",
            decider: "Ana Kovač",
            comment: "  \n "
        });

        expect(message.body).toBe("Rejected at Legal sign-off by Ana Kovač.");
        expect(message.text).toBe("Rejected at Legal sign-off by Ana Kovač.");
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

        expect(message.title).toBe('“<script>alert(1)</script>” was rejected at Step "one"');
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
