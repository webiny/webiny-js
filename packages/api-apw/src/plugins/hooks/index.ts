import linkWorkflowToPage from "./linkWorkflowToPage";
import deleteCommentsAfterChangeRequest from "./deleteCommentsAfterChangeRequest";

export default () => [linkWorkflowToPage(), deleteCommentsAfterChangeRequest()];
