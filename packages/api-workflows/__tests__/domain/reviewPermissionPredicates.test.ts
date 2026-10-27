import { describe, expect, it } from "vitest";
import { canCancelByPermission } from "~/domain/review/canCancelByPermission.js";
import { canReassignByPermission } from "~/domain/review/canReassignByPermission.js";
import { canRestartByPermission } from "~/domain/review/canRestartByPermission.js";
import type { Actor, ReviewData, ReviewPermissionViewer } from "~/domain/review/types.js";
import type { WorkflowsPermissionSet } from "~/domain/permissions/types.js";
import {
    aiActor,
    createRequestedReview,
    createStartedReview,
    expectOk,
    requester,
    reviewer,
    toSaveData
} from "~tests/__helpers/fixtures.js";
import {
    automationActor,
    createFailedAutomationReview,
    createRunningAutomationReview
} from "~tests/__helpers/stepRunReviews.js";

const LATER = "2026-10-09T11:00:00.000Z";

const NO_PERMISSIONS: WorkflowsPermissionSet = {
    fullAccess: false,
    editor: false,
    reassign: false
};
const EDITOR: WorkflowsPermissionSet = { fullAccess: false, editor: true, reassign: false };
const REASSIGN: WorkflowsPermissionSet = { fullAccess: false, editor: false, reassign: true };
const FULL_ACCESS: WorkflowsPermissionSet = { fullAccess: true, editor: true, reassign: true };

const viewerOf = (
    actor: Actor,
    permissions: WorkflowsPermissionSet = NO_PERMISSIONS
): ReviewPermissionViewer => {
    return { actor, permissions };
};

const requestedReview = (): ReviewData => toSaveData(createRequestedReview());

const cancelledReview = (): ReviewData => {
    const review = createStartedReview();
    expectOk(review.cancel({ actor: requester, now: LATER }));
    return toSaveData(review);
};

describe("canCancelByPermission", () => {
    it("lets the requesting user cancel (D25)", () => {
        expect(canCancelByPermission(requestedReview(), viewerOf(requester))).toBe(true);
    });

    it("lets reassign holders and full access cancel any review (D54)", () => {
        expect(canCancelByPermission(requestedReview(), viewerOf(reviewer, REASSIGN))).toBe(true);
        expect(canCancelByPermission(requestedReview(), viewerOf(reviewer, FULL_ACCESS))).toBe(
            true
        );
    });

    it("refuses other users, editors and AI actors carrying the requester's id (D58)", () => {
        expect(canCancelByPermission(requestedReview(), viewerOf(reviewer))).toBe(false);
        expect(canCancelByPermission(requestedReview(), viewerOf(reviewer, EDITOR))).toBe(false);
        expect(canCancelByPermission(requestedReview(), viewerOf(aiActor))).toBe(false);
    });

    it("ignores the review state, which the engine reports (R41)", () => {
        expect(canCancelByPermission(cancelledReview(), viewerOf(requester))).toBe(true);
    });
});

describe("canReassignByPermission", () => {
    it("grants reassign only with reassign or full access (D33)", () => {
        expect(canReassignByPermission(viewerOf(reviewer, REASSIGN))).toBe(true);
        expect(canReassignByPermission(viewerOf(reviewer, FULL_ACCESS))).toBe(true);
        expect(canReassignByPermission(viewerOf(reviewer, EDITOR))).toBe(false);
        expect(canReassignByPermission(viewerOf(requester))).toBe(false);
    });
});

describe("canRestartByPermission", () => {
    const failedReview = (): ReviewData => toSaveData(createFailedAutomationReview());

    it("lets the requesting user restart (D34)", () => {
        expect(canRestartByPermission(failedReview(), viewerOf(requester))).toBe(true);
    });

    it("lets reassign holders and full access restart any review (D34, D54)", () => {
        expect(canRestartByPermission(failedReview(), viewerOf(reviewer, REASSIGN))).toBe(true);
        expect(canRestartByPermission(failedReview(), viewerOf(reviewer, FULL_ACCESS))).toBe(true);
    });

    it("refuses other users, editors, and AI or automation actors carrying the requester's id (D58)", () => {
        expect(canRestartByPermission(failedReview(), viewerOf(reviewer))).toBe(false);
        expect(canRestartByPermission(failedReview(), viewerOf(reviewer, EDITOR))).toBe(false);
        expect(canRestartByPermission(failedReview(), viewerOf(aiActor))).toBe(false);
        expect(canRestartByPermission(failedReview(), viewerOf(automationActor))).toBe(false);
    });

    it("ignores the review state, which the engine reports (R41)", () => {
        const running = toSaveData(createRunningAutomationReview());

        expect(canRestartByPermission(running, viewerOf(requester))).toBe(true);
        expect(canRestartByPermission(cancelledReview(), viewerOf(requester))).toBe(true);
    });

    it("does not change the review it reads", () => {
        const data = failedReview();
        const copy = structuredClone(data);

        canRestartByPermission(data, viewerOf(requester));

        expect(data).toEqual(copy);
    });
});
