import type { ReviewActor } from "~/review/domain/types.js";

/*
 * A person is named; an AI or automation owner shows the step title, never the model or
 * automation behind it (QBZ-79).
 */
export const getListOwnerLabel = (
    owner: ReviewActor | null,
    stepTitle: string | null
): string | null => {
    if (!owner) {
        return null;
    }
    if (owner.type === "user") {
        return owner.displayName;
    }
    return stepTitle ?? owner.displayName;
};
