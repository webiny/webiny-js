import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { getReviewActions } from "./getReviewActions.js";
import { createFlags } from "~/review/testing/createFlags.js";

describe("getReviewActions", () => {
    it("offers Request review without an active review when the app allows it (R217)", () => {
        expect(
            getReviewActions({
                flags: null,
                stepId: null,
                canRequest: true,
                requestBlockReason: null
            })
        ).toEqual([
            {
                kind: "request",
                label: "Request review",
                icon: "send",
                stepId: null,
                emphasis: "primary",
                disabledReason: null
            }
        ]);
    });

    it("offers nothing without an active review when the app does not allow a request", () => {
        expect(
            getReviewActions({
                flags: null,
                stepId: null,
                canRequest: false,
                requestBlockReason: null
            })
        ).toEqual([]);
    });

    it("never offers Request review next to an active review", () => {
        const actions = getReviewActions({
            flags: createFlags({ canStart: true }),
            stepId: "step-1",
            canRequest: true,
            requestBlockReason: null
        });
        expect(actions.map(action => action.kind)).toEqual(["start"]);
    });

    it("maps the server flags to actions with the README labels and icons", () => {
        const actions = getReviewActions({
            flags: createFlags({ canStart: true }),
            stepId: "step-2",
            canRequest: false,
            requestBlockReason: null
        });
        expect(actions).toEqual([
            {
                kind: "start",
                label: "Start",
                icon: "play_arrow",
                stepId: "step-2",
                emphasis: "primary",
                disabledReason: null
            }
        ]);
    });

    it("orders every action ghost, tertiary, secondary, primary", () => {
        const actions = getReviewActions({
            flags: createFlags({
                canStart: true,
                canTakeOver: true,
                canApprove: true,
                canReject: true,
                canCancel: true,
                canReassign: true,
                canRestart: true
            }),
            stepId: "step-1",
            canRequest: false,
            requestBlockReason: null
        });
        expect(actions.map(action => [action.kind, action.emphasis])).toEqual([
            ["cancel", "ghost"],
            ["reassign", "tertiary"],
            ["reject", "tertiary"],
            ["takeOver", "secondary"],
            ["start", "primary"],
            ["approve", "primary"],
            ["restart", "primary"]
        ]);
        const labels = actions.map(action => action.label);
        expect(labels).toEqual([
            "Cancel review",
            "Reassign",
            "Reject",
            "Take over",
            "Start",
            "Approve",
            "Restart"
        ]);
        const icons = actions.map(action => action.icon);
        expect(icons).toEqual([
            "block",
            "swap_horiz",
            "close",
            "front_hand",
            "play_arrow",
            "check",
            "refresh"
        ]);
    });

    it("offers Restart only when the server flag allows it (D34, D82)", () => {
        const withFlag = getReviewActions({
            flags: createFlags({ canRestart: true }),
            stepId: "step-3",
            canRequest: false,
            requestBlockReason: null
        });
        const withoutFlag = getReviewActions({
            flags: createFlags({ canStart: true }),
            stepId: "step-3",
            canRequest: false,
            requestBlockReason: null
        });

        expect(withFlag).toEqual([
            {
                kind: "restart",
                label: "Restart",
                icon: "refresh",
                stepId: "step-3",
                emphasis: "primary",
                disabledReason: null
            }
        ]);
        expect(withoutFlag.map(action => action.kind)).toEqual(["start"]);
    });

    it("never offers Restart without an active review", () => {
        expect(
            getReviewActions({
                flags: null,
                stepId: null,
                canRequest: true,
                requestBlockReason: null
            })
        ).toEqual([
            {
                kind: "request",
                label: "Request review",
                icon: "send",
                stepId: null,
                emphasis: "primary",
                disabledReason: null
            }
        ]);
    });

    it("disables Request review with the block reason and leaves it enabled without one", () => {
        const blocked = getReviewActions({
            flags: null,
            stepId: null,
            canRequest: true,
            requestBlockReason: "Save your changes before requesting a review."
        });
        expect(blocked[0].disabledReason).toBe("Save your changes before requesting a review.");

        const free = getReviewActions({
            flags: null,
            stepId: null,
            canRequest: true,
            requestBlockReason: null
        });
        expect(free[0].disabledReason).toBeNull();
    });

    it("never disables the other actions with the block reason", () => {
        const actions = getReviewActions({
            flags: createFlags({ canStart: true, canCancel: true }),
            stepId: "step-1",
            canRequest: false,
            requestBlockReason: "Save your changes before requesting a review."
        });
        expect(actions.map(action => action.disabledReason)).toEqual([null, null]);
    });
});
