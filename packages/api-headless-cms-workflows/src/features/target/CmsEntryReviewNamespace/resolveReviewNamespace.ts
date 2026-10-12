import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import type { CmsEntryReviewNamespace } from "./abstractions.js";

/** The last registered non-null namespace for the model, or `null` (R51). */
export const resolveReviewNamespace = (
    namespaces: CmsEntryReviewNamespace.Interface[],
    model: CmsModel
): string | null => {
    for (const namespace of [...namespaces].reverse()) {
        const resolved = namespace.resolve(model);
        if (resolved) {
            return resolved;
        }
    }
    return null;
};
