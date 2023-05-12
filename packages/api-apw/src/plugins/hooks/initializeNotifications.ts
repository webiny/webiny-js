import { ApwContext } from "~/types";
import { attachContentReviewAfterCreate } from "./notifications/contentReviewAfterCreate";
import { attachCommentAfterCreate } from "./notifications/commentAfterCreate";
import { attachChangeRequestAfterCreate } from "./notifications/changeRequestAfterCreate";

export const initializeNotifications = (context: ApwContext) => {
    attachContentReviewAfterCreate(context);
    attachCommentAfterCreate(context);
    attachChangeRequestAfterCreate(context);
};
