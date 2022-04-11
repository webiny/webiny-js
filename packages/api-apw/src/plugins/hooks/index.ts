import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { ApwContext } from "~/types";
import extendPbPageSchema from "./extendPbPageSchema";
import { linkWorkflowToPage } from "./linkWorkflowToPage";
import { deleteCommentsAfterChangeRequest } from "./deleteCommentsAfterChangeRequest";
import { deleteChangeRequestsWithContentReview } from "./deleteChangeRequestsAfterContentReview";
import { createReviewerFromIdentity } from "./createReviewerFromIdentity";
import { initializeContentReviewSteps } from "./initializeContentReviewSteps";
import { updatePendingChangeRequestsCount } from "./updatePendingChangeRequests";
import { updateTotalCommentsCount, updateLatestCommentId } from "./updateTotalComments";
import { validateChangeRequest } from "./validateChangeRequest";
import { validateContentReview } from "./validateContentReview";
import { validateComment } from "./validateComment";
import { checkInstallation } from "../utils";

export default () => [
    extendPbPageSchema(),
    /**
     * Hook into CMS events and execute business logic.
     */
    new ContextPlugin<ApwContext>(async context => {
        const { security, apw, pageBuilder, tenancy, i18nContent } = context;

        checkInstallation({ tenancy, i18nContent });

        const pageMethods = {
            onBeforePageCreate: pageBuilder.onBeforePageCreate,
            onBeforePageCreateFrom: pageBuilder.onBeforePageCreateFrom,
            onBeforePageUpdate: pageBuilder.onBeforePageUpdate,
            getPage: pageBuilder.getPage,
            updatePage: pageBuilder.updatePage
        };

        validateContentReview({ apw });

        validateChangeRequest({ apw });

        validateComment({ apw });

        createReviewerFromIdentity({ security, apw });

        linkWorkflowToPage({ apw, ...pageMethods });

        initializeContentReviewSteps({ apw });

        updatePendingChangeRequestsCount({ apw });

        updateTotalCommentsCount({ apw });

        updateLatestCommentId({ apw });

        deleteCommentsAfterChangeRequest({ apw });

        deleteChangeRequestsWithContentReview({ apw });
    })
];
