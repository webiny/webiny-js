import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData, ReviewViewer } from "@webiny/api-workflows/domain/review/types.js";
import type {
    WorkflowsNotAuthenticatedError,
    WorkflowsNotAuthorizedError
} from "@webiny/api-workflows/domain/permissions/errors.js";
import type {
    ReviewNotFoundError,
    ReviewPersistenceError
} from "@webiny/api-workflows/domain/review/errors.js";

export interface CmsEntryReviewGuardServiceParams {
    reviewId: string;
    /** What the caller tries to do, e.g. "start this step"; named in `Workflows/NotAuthorized`. */
    action: string;
}

export interface AuthorizedCmsEntryReview {
    review: ReviewData;
    viewer: ReviewViewer;
}

export interface ICmsEntryReviewGuardServiceErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    notFound: ReviewNotFoundError;
    persistence: ReviewPersistenceError;
}

type GuardError = ICmsEntryReviewGuardServiceErrors[keyof ICmsEntryReviewGuardServiceErrors];

export interface ICmsEntryReviewGuardService {
    authorize(
        params: CmsEntryReviewGuardServiceParams
    ): Promise<Result<AuthorizedCmsEntryReview, GuardError>>;
}

/**
 * The checks every CMS review action shares (spec 5.1, D133 point 7): a signed-in viewer, a review
 * of a `cms.*` namespace (another app's review is not found, R46) and read access to its target
 * with the CMS's own logic (R47). Permission rules per action (cancel) stay in the wrapper.
 */
export const CmsEntryReviewGuardService = createAbstraction<ICmsEntryReviewGuardService>(
    "CmsEntryReviewGuardService"
);

export namespace CmsEntryReviewGuardService {
    export type Interface = ICmsEntryReviewGuardService;
    export type Params = CmsEntryReviewGuardServiceParams;
    export type Authorized = AuthorizedCmsEntryReview;
    export type Error = GuardError;
    export type Return = Promise<Result<AuthorizedCmsEntryReview, GuardError>>;
}
