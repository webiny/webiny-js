import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { getReviewActions } from "./getReviewActions.js";
import { createFlags } from "~/review/testing/createFlags.js";

describe("getReviewActions", () => {
    it("offers Request review without an active review when the app allows it (R217)", () => {
        expect(getReviewActions({ flags: null, stepId: null, canRequest: true })).toEqual([
            {
                kind: "request",
                label: "Request review",
                icon: "send",
                stepId: null,
                emphasis: "primary"
            }
        ]);
    });

    it("offers nothing without an active review when the app does not allow a request", () => {
        expect(getReviewActions({ flags: null, stepId: null, canRequest: false })).toEqual([]);
    });

    it("never offers Request review next to an active review", () => {
        const actions = getReviewActions({
            flags: createFlags({ canStart: true }),
            stepId: "step-1",
            canRequest: true
        });
        expect(actions.map(action => action.kind)).toEqual(["start"]);
    });

    it("maps the server flags to actions with the README labels and icons", () => {
        const actions = getReviewActions({
            flags: createFlags({ canStart: true }),
            stepId: "step-2",
            canRequest: false
        });
        expect(actions).toEqual([
            {
                kind: "start",
                label: "Start",
                icon: "play_arrow",
                stepId: "step-2",
                emphasis: "primary"
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
                canReassign: true
            }),
            stepId: "step-1",
            canRequest: false
        });
        expect(actions.map(action => [action.kind, action.emphasis])).toEqual([
            ["cancel", "ghost"],
            ["reassign", "tertiary"],
            ["reject", "tertiary"],
            ["takeOver", "secondary"],
            ["start", "primary"],
            ["approve", "primary"]
        ]);
        const labels = actions.map(action => action.label);
        expect(labels).toEqual([
            "Cancel review",
            "Reassign",
            "Reject",
            "Take over",
            "Start",
            "Approve"
        ]);
        const icons = actions.map(action => action.icon);
        expect(icons).toEqual([
            "block",
            "swap_horiz",
            "close",
            "front_hand",
            "play_arrow",
            "check"
        ]);
    });

    it("never offers Restart (8b), also when the server allows it", () => {
        const actions = getReviewActions({
            flags: createFlags({ canRestart: true }),
            stepId: "step-1",
            canRequest: false
        });
        expect(actions).toEqual([]);
    });
});
