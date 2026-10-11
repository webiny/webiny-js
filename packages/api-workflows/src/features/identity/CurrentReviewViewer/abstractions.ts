import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Actor, ReviewViewer } from "~/domain/review/types.js";
import type { WorkflowsNotAuthenticatedError } from "~/domain/permissions/errors.js";

export interface ICurrentReviewViewer {
    /**
     * The current identity as a `user` actor, API keys included (`identityType: "api-key"`,
     * D133). Reads only the identity: no team lookup, no permission read.
     */
    getActor(): Result<Actor, WorkflowsNotAuthenticatedError>;
    /** The current identity as a review viewer: actor, team ids and workflows permissions. */
    get(): Promise<Result<ReviewViewer, WorkflowsNotAuthenticatedError>>;
}

/**
 * Builds the reading user for viewer flags and the actor and team ids for the internal review
 * use cases, in one place for every app wrapper (D132, R37, R42). Only an anonymous identity is
 * refused.
 */
export const CurrentReviewViewer = createAbstraction<ICurrentReviewViewer>("CurrentReviewViewer");

export namespace CurrentReviewViewer {
    export type Interface = ICurrentReviewViewer;
    export type ActorResult = Result<Actor, WorkflowsNotAuthenticatedError>;
    export type Return = Promise<Result<ReviewViewer, WorkflowsNotAuthenticatedError>>;
}
