import { ApwContext } from "~/types";
import { attachCommentAfterCreate } from "./notifications/commentAfterCreate";
import { attachChangeRequestAfterCreate } from "./notifications/changeRequestAfterCreate";

export const initializeNotifications = (context: ApwContext) => {
    attachCommentAfterCreate(context);
    attachChangeRequestAfterCreate(context);
};
