import { getLastContentReviewNotificationPlugin } from "./lastContentReviewNotificationPlugin";
import { ApwContentReviewNotificationCbParams } from "~/ApwContentReviewNotification";

export const sendContentReviewNotification = async (
    params: ApwContentReviewNotificationCbParams
): Promise<void> => {
    const { context, reviewers, contentReview } = params;
    if (reviewers.length === 0) {
        return;
    }

    const contentReviewPlugin = getLastContentReviewNotificationPlugin({
        context,
        type: contentReview.content.type
    });
    if (!contentReviewPlugin) {
        console.log("No e-mail body content review plugin.");
        return;
    }

    const body = contentReviewPlugin.create(params);
    if (!body) {
        console.log(`No e-mail body from the content review plugin: ${contentReviewPlugin.name}`);
        return;
    }

    const result = await context.mailer.sendMail({
        bcc: reviewers.map(r => r.email),
        subject: "There is a new content review which you are assigned on.",
        text: body.text,
        html: body.html || body.text
    });
    if (!result.error) {
        return;
    }
    console.log("Error while sending e-mail", JSON.stringify(result.error));
};
