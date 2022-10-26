import { ApwContext } from "~/types";
import { attachReviewerChanged } from "~/plugins/hooks/notifications/reviewerChanged";

export const initializeNotifications = (context: ApwContext) => {
    attachReviewerChanged(context);
};
