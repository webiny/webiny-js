import type { ReviewActor } from "~/review/domain/types.js";

export const createActor = (overrides: Partial<ReviewActor> = {}): ReviewActor => {
    return {
        type: "user",
        id: "user-1",
        displayName: "Maja Kos",
        identityType: null,
        ...overrides
    };
};
