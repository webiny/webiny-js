import { ApwChangeRequest, ApwContentReview, ApwContext, ApwReviewer, ApwWorkflow } from "~/types";
import { getLastNotificationPlugin } from "~/plugins/hooks/notifications/utils";

interface Params {
    context: ApwContext;
    reviewers: ApwReviewer[];
    commentUrl: string;
    changeRequest: ApwChangeRequest;
    contentReview: ApwContentReview;
    workflow: ApwWorkflow;
}

export const sendCommentNotification = async (params: Params): Promise<void> => {
    const { context, reviewers, contentReview } = params;

    const commentPlugin = getLastNotificationPlugin({
        context,
        type: contentReview.content.type
    });
    if (!commentPlugin) {
        return;
    }

    const body = commentPlugin.create(params);
    if (!body) {
        return;
    }

    await context.mailer.sendMail({
        /**
         * Filter empty emails just in case...
         */
        to: reviewers.map(r => r.email).filter(Boolean) as string[],
        subject: "There is a new comment on the Content Review you are assigned on.",
        text: body,
        html: body
    });
};
