import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { ApwContext } from "~/types";
import extendPbPageSchema from "./extendPbPageSchema";
import { linkWorkflowToPage } from "./linkWorkflowToPage";
import { deleteCommentsAfterChangeRequest } from "./deleteCommentsAfterChangeRequest";
import { deleteChangeRequestsWithContentReview } from "./deleteChangeRequestsAfterContentReview";
import { createReviewerFromIdentity } from "./createReviewerFromIdentity";
import { initializeContentReviewSteps } from "./initializeContentReviewSteps";
import { updatePendingChangeRequestsCount } from "./updatePendingChangeRequests";

export default () => [
    extendPbPageSchema(),
    /**
     * Hook into CMS events and execute business logic.
     */
    new ContextPlugin<ApwContext>(async context => {
        const { security, apw, pageBuilder } = context;
        const pageMethods = {
            onBeforePageCreate: pageBuilder.onBeforePageCreate,
            onBeforePageCreateFrom: pageBuilder.onBeforePageCreateFrom,
            onBeforePageUpdate: pageBuilder.onBeforePageUpdate,
            getPage: pageBuilder.getPage,
            updatePage: pageBuilder.updatePage
        };

        createReviewerFromIdentity({ security, apw });

        linkWorkflowToPage({ apw, ...pageMethods });

        initializeContentReviewSteps({ apw });

        updatePendingChangeRequestsCount({ apw });

        deleteCommentsAfterChangeRequest({ apw });

        deleteChangeRequestsWithContentReview({ apw });
    })
];
