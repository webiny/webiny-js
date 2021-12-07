import linkWorkflowToPage from "./linkWorkflowToPage";
import deleteCommentsAfterChangeRequest from "./deleteCommentsAfterChangeRequest";
import initializeContentReviewSteps from "./initializeContentReviewSteps";
import deleteChangeRequestsAfterContentReview from "./deleteChangeRequestsAfterContentReview";

export default () => [
    linkWorkflowToPage(),
    deleteCommentsAfterChangeRequest(),
    initializeContentReviewSteps(),
    deleteChangeRequestsAfterContentReview()
];
