import { getLastCommentNotificationPlugin } from "./lastCommentNotificationPlugin";
import { ApwCommentNotificationCbParams } from "~/ApwCommentNotification";

export const sendCommentNotification = async (
    params: ApwCommentNotificationCbParams
): Promise<void> => {
    const { context, reviewers, contentReview } = params;
    if (reviewers.length === 0) {
        return;
    }

    const commentPlugin = getLastCommentNotificationPlugin({
        context,
        type: contentReview.content.type
    });
    if (!commentPlugin) {
        console.log("No e-mail body comment plugin.");
        return;
    }

    const body = commentPlugin.create(params);
    if (!body) {
        console.log(`No e-mail body from the comment plugin: ${commentPlugin.name}`);
        return;
    }

    const result = await context.mailer.sendMail({
        bcc: reviewers.map(r => r.email),
        subject: "There is a new comment on the Content Review you are assigned on.",
        text: body.text,
        html: body.html || body.text
    });
    if (!result.error) {
        return;
    }
    console.log("Error while sending e-mail", JSON.stringify(result.error));
};
