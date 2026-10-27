import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { getEditorRules } from "./getEditorRules.js";
import { MOVE_BLOCKED_IN_REVIEW } from "./moveBlockedInReview.js";

const CHECKING = "Checking review status…";
const FAILED = "The review status could not be loaded. Try again from the review bar.";
const NEEDS_REVIEW = "Publishing needs an approved review. Request a review first.";
const REJECTED = "This revision was rejected. Create a new revision, then request a new review.";
const IN_REVIEW = "This revision is in review. Publishing is allowed once every step approves.";

describe("getEditorRules", () => {
    it("locks everything while the status loads (QBZ-1)", () => {
        const rules = getEditorRules({
            status: "loading",
            reviewKind: "none",
            isUnpublished: false
        });
        expect(rules).toEqual({
            allowsEditing: false,
            allowsPublishing: false,
            publishDisabledReason: CHECKING,
            moveDisabledReason: CHECKING
        });
    });

    it("locks everything after a failed load", () => {
        const rules = getEditorRules({
            status: "failed",
            reviewKind: "none",
            isUnpublished: false
        });
        expect(rules).toEqual({
            allowsEditing: false,
            allowsPublishing: false,
            publishDisabledReason: FAILED,
            moveDisabledReason: FAILED
        });
    });

    it("changes nothing for content without a workflow", () => {
        const rules = getEditorRules({
            status: "noWorkflow",
            reviewKind: "none",
            isUnpublished: false
        });
        expect(rules).toEqual({
            allowsEditing: true,
            allowsPublishing: true,
            publishDisabledReason: null,
            moveDisabledReason: null
        });
    });

    it("allows editing but not publishing without a review", () => {
        const rules = getEditorRules({ status: "none", reviewKind: "none", isUnpublished: false });
        expect(rules).toEqual({
            allowsEditing: true,
            allowsPublishing: false,
            publishDisabledReason: NEEDS_REVIEW,
            moveDisabledReason: null
        });
    });

    it("allows publishing an unpublished revision with no review (Q19, R226)", () => {
        const rules = getEditorRules({ status: "none", reviewKind: "none", isUnpublished: true });
        expect(rules).toEqual({
            allowsEditing: true,
            allowsPublishing: true,
            publishDisabledReason: null,
            moveDisabledReason: null
        });
    });

    it("does not let isUnpublished override an active review", () => {
        const inProgress = getEditorRules({
            status: "active",
            reviewKind: "inProgress",
            isUnpublished: true
        });
        expect(inProgress).toEqual({
            allowsEditing: false,
            allowsPublishing: false,
            publishDisabledReason: IN_REVIEW,
            moveDisabledReason: MOVE_BLOCKED_IN_REVIEW
        });
        const rejected = getEditorRules({
            status: "active",
            reviewKind: "rejected",
            isUnpublished: true
        });
        expect(rejected.allowsPublishing).toBe(false);
    });

    it("locks editing, publishing and moving while a review is in progress", () => {
        const rules = getEditorRules({
            status: "active",
            reviewKind: "inProgress",
            isUnpublished: false
        });
        expect(rules).toEqual({
            allowsEditing: false,
            allowsPublishing: false,
            publishDisabledReason: IN_REVIEW,
            moveDisabledReason: MOVE_BLOCKED_IN_REVIEW
        });
    });

    it("allows publishing an approved revision but not editing it", () => {
        const rules = getEditorRules({
            status: "active",
            reviewKind: "approved",
            isUnpublished: false
        });
        expect(rules).toEqual({
            allowsEditing: false,
            allowsPublishing: true,
            publishDisabledReason: null,
            moveDisabledReason: null
        });
    });

    it("locks a rejected revision for good", () => {
        const rules = getEditorRules({
            status: "active",
            reviewKind: "rejected",
            isUnpublished: false
        });
        expect(rules).toEqual({
            allowsEditing: false,
            allowsPublishing: false,
            publishDisabledReason: REJECTED,
            moveDisabledReason: null
        });
    });
});
