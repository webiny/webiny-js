import linkWorkflowToPage from "./linkWorkflowToPage";
import deleteCommentsAfterChangeRequest from "./deleteCommentsAfterChangeRequest";
import initializeContentReviewSteps from "./initializeContentReviewSteps";
import deleteChangeRequestsAfterContentReview from "./deleteChangeRequestsAfterContentReview";
import updatePendingChangeRequests from "./updatePendingChangeRequests";
import { createReviewerFromIdentity } from "./createReviewerFromIdentity";

export default () => [
    linkWorkflowToPage(),
    deleteCommentsAfterChangeRequest(),
    initializeContentReviewSteps(),
    deleteChangeRequestsAfterContentReview(),
    updatePendingChangeRequests(),
    createReviewerFromIdentity()
];
