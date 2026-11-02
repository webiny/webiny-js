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

export interface WbPageReviewGuardServiceParams {
    reviewId: string;
    /** What the caller tries to do, e.g. "start this step"; named in `Workflows/NotAuthorized`. */
    action: string;
}

export interface AuthorizedWbPageReview {
    review: ReviewData;
    viewer: ReviewViewer;
}

export interface IWbPageReviewGuardServiceErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    notFound: ReviewNotFoundError;
    persistence: ReviewPersistenceError;
}

type GuardError = IWbPageReviewGuardServiceErrors[keyof IWbPageReviewGuardServiceErrors];

export interface IWbPageReviewGuardService {
    authorize(
        params: WbPageReviewGuardServiceParams
    ): Promise<Result<AuthorizedWbPageReview, GuardError>>;
}

/**
 * The checks every page review action shares (spec 5.1, D133 point 7): a signed-in viewer, a
 * `wb.page` review (another app's review is not found, R46) and read access to the page with
 * Website Builder's own logic (R47). Permission rules per action (cancel) stay in the wrapper.
 */
export const WbPageReviewGuardService = createAbstraction<IWbPageReviewGuardService>(
    "WbPageReviewGuardService"
);

export namespace WbPageReviewGuardService {
    export type Interface = IWbPageReviewGuardService;
    export type Params = WbPageReviewGuardServiceParams;
    export type Authorized = AuthorizedWbPageReview;
    export type Error = GuardError;
    export type Return = Promise<Result<AuthorizedWbPageReview, GuardError>>;
}
