import type { ReviewListScope } from "~/review/domain/ReviewListScope.js";
import { REVIEW_LIST_SCOPES } from "./reviewListScopes.js";

// Narrows a string (a route parameter, a control value) to a list scope, or `null`.
export const parseReviewListScope = (value: string | null | undefined): ReviewListScope | null => {
    const scope = REVIEW_LIST_SCOPES.find(item => item.value === value);
    if (!scope) {
        return null;
    }
    return scope.value;
};
