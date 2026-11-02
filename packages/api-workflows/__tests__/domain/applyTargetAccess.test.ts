import { describe, expect, it } from "vitest";
import { applyTargetAccess } from "~/domain/review/applyTargetAccess.js";
import type { ReviewViewerFlags } from "~/domain/review/types.js";

const ALL_TRUE: ReviewViewerFlags = {
    canStart: true,
    canTakeOver: true,
    canApprove: true,
    canReject: true,
    canCancel: true,
    canReassign: true,
    canRestart: true
};

const ALL_FALSE: ReviewViewerFlags = {
    canStart: false,
    canTakeOver: false,
    canApprove: false,
    canReject: false,
    canCancel: false,
    canReassign: false,
    canRestart: false
};

describe("applyTargetAccess", () => {
    it("clears every flag without read access", () => {
        expect(applyTargetAccess(ALL_TRUE, { canRead: false })).toEqual(ALL_FALSE);
    });

    it("keeps the flags with read access", () => {
        const flags: ReviewViewerFlags = { ...ALL_FALSE, canApprove: true, canCancel: true };

        expect(applyTargetAccess(flags, { canRead: true })).toEqual(flags);
    });
});
