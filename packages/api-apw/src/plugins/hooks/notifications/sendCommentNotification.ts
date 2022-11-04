import {
    ApwChangeRequest,
    ApwContentReview,
    ApwContext,
    ApwReviewerWithEmail,
    ApwWorkflow
} from "~/types";
import { getLastCommentNotificationPlugin } from "./lastCommentNotificationPlugin";

interface Params {
    context: ApwContext;
    reviewers: ApwReviewerWithEmail[];
    commentUrl: string;
    contentUrl: string;
    changeRequest: ApwChangeRequest;
    contentReview: ApwContentReview;
    workflow: ApwWorkflow;
}

export const sendCommentNotification = async (params: Params): Promise<void> => {
    const { context, reviewers, contentReview } = params;

    const commentPlugin = getLastCommentNotificationPlugin({
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
        bcc: reviewers.map(r => r.email),
        subject: "There is a new comment on the Content Review you are assigned on.",
        text: body.text,
        html: body.html || body.text
    });
};
