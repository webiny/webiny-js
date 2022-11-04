import {
    ApwChangeRequest,
    ApwContentReview,
    ApwContext,
    ApwReviewerWithEmail,
    ApwWorkflow
} from "~/types";
import { getLastChangeRequestNotificationPlugin } from "./lastChangeRequestNotificationPlugin";

interface Params {
    context: ApwContext;
    reviewers: ApwReviewerWithEmail[];
    changeRequestUrl: string;
    contentUrl: string;
    changeRequest: ApwChangeRequest;
    contentReview: ApwContentReview;
    workflow: ApwWorkflow;
}

export const sendChangeRequestNotification = async (params: Params): Promise<void> => {
    const { context, reviewers, contentReview } = params;

    const commentPlugin = getLastChangeRequestNotificationPlugin({
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
        subject: "There is a new change request on the Content Review you are assigned on.",
        text: body.text,
        html: body.html || body.text
    });
};
