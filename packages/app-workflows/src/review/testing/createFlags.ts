import type { ReviewViewerFlags } from "~/review/domain/types.js";

export const createFlags = (overrides: Partial<ReviewViewerFlags> = {}): ReviewViewerFlags => {
    return {
        canStart: false,
        canTakeOver: false,
        canApprove: false,
        canReject: false,
        canCancel: false,
        canReassign: false,
        canRestart: false,
        ...overrides
    };
};
