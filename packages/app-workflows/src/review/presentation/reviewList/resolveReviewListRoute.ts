import { isEmptyReviewListFilter } from "~/review/domain/isEmptyReviewListFilter.js";
import type { ReviewListScope } from "~/review/domain/ReviewListScope.js";
import type { ReviewListState } from "~/review/domain/ReviewListState.js";
import type { ReviewListRouteParams } from "./abstractions.js";
import { getDefaultReviewListState } from "./getDefaultReviewListState.js";

export interface ResolvedReviewListRoute {
    scope: ReviewListScope;
    state: ReviewListState;
}

/*
 * The scope and state the list shows for a route. Every scope is open to every viewer (designer
 * answer B7); the server decides what it lists. A missing scope is Assigned to me; a missing state,
 * or one empty by definition for the scope, is the scope's default state.
 */
export const resolveReviewListRoute = (params: ReviewListRouteParams): ResolvedReviewListRoute => {
    const scope: ReviewListScope = params.scope ?? "assignedToMe";
    let state = params.state ?? getDefaultReviewListState(scope);
    if (isEmptyReviewListFilter(scope, state)) {
        state = getDefaultReviewListState(scope);
    }
    return { scope, state };
};
