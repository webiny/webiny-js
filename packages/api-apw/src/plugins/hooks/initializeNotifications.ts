import { ApwContext } from "~/types";
// import { attachReviewerChanged } from "~/plugins/hooks/notifications/reviewerChanged";
import { attachCommentAfterCreate } from "~/plugins/hooks/notifications/commentAfterCreate";
import { attachChangeRequestAfterCreate } from "~/plugins/hooks/notifications/changeRequestAfterCreate";

export const initializeNotifications = (context: ApwContext) => {
    // attachReviewerChanged(context);
    attachCommentAfterCreate(context);
    attachChangeRequestAfterCreate(context);
};
