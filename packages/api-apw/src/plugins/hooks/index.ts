import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
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
import { isInstallationPending } from "../utils";

export default () =>
    /**
     * Hook into CMS events and execute business logic.
     */
    new ContextPlugin<ApwContext>(async context => {
        const { security, apw, tenancy, i18n } = context;

        if (isInstallationPending({ tenancy, i18n })) {
            return;
        }

        validateContentReview({ apw });

        validateChangeRequest({ apw });

        validateComment({ apw });

        createReviewerFromIdentity({ security, apw });

        initializeContentReviewSteps({ apw });

        updatePendingChangeRequestsCount({ apw });

        updateTotalCommentsCount({ apw });

        updateLatestCommentId({ apw });

        deleteCommentsAfterChangeRequest({ apw });

        deleteChangeRequestsWithContentReview({ apw });
    });
