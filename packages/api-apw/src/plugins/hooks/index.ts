import linkWorkflowToPage from "./linkWorkflowToPage";
import deleteCommentsAfterChangeRequest from "./deleteCommentsAfterChangeRequest";
import initializeContentReviewSteps from "./initializeContentReviewSteps";
import deleteChangeRequestsAfterContentReview from "./deleteChangeRequestsAfterContentReview";
import updatePendingChangeRequests from "./updatePendingChangeRequests";

export default () => [
    linkWorkflowToPage(),
    deleteCommentsAfterChangeRequest(),
    initializeContentReviewSteps(),
    deleteChangeRequestsAfterContentReview(),
    updatePendingChangeRequests()
];
