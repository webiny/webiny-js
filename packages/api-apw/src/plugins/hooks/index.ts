import { ContextPlugin } from "@webiny/api";
import { ApwContext } from "~/types";
import { deleteCommentsAfterChangeRequest } from "./deleteCommentsAfterChangeRequest";
import { deleteChangeRequestsWithContentReview } from "./deleteChangeRequestsAfterContentReview";
import { createReviewerFromIdentity } from "./createReviewerFromIdentity";
import { initializeContentReviewSteps } from "./initializeContentReviewSteps";
import { updatePendingChangeRequestsCount } from "./updatePendingChangeRequests";
import { updateTotalCommentsCount, updateLatestCommentId } from "./updateTotalComments";
import { validateChangeRequest } from "./validateChangeRequest";
import { validateContentReview } from "./validateContentReview";
import { validateComment } from "./validateComment";
import { listContentReviews } from "./listContentReviews";
import { initializeNotifications } from "./initializeNotifications";

export const attachApwHooks = () =>
    /**
     * Hook into CMS events and execute business logic.
     */
    new ContextPlugin<ApwContext>(async context => {
        const { security, apw } = context;

        validateContentReview({ apw });

        validateChangeRequest({ apw });

        validateComment({ apw });

        createReviewerFromIdentity({ security, apw });

        initializeContentReviewSteps(context);

        updatePendingChangeRequestsCount({ apw });

        updateTotalCommentsCount({ apw });

        updateLatestCommentId({ apw });

        deleteCommentsAfterChangeRequest({ apw });

        deleteChangeRequestsWithContentReview({ apw });

        listContentReviews(context);

        initializeNotifications(context);
    });
