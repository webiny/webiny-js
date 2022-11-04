import { getLastCommentNotificationPlugin } from "./lastCommentNotificationPlugin";
import { ApwCommentNotificationCbParams } from "~/ApwCommentNotification";

export const sendCommentNotification = async (
    params: ApwCommentNotificationCbParams
): Promise<void> => {
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
