import { getLastChangeRequestNotificationPlugin } from "./lastChangeRequestNotificationPlugin";
import { ApwChangeRequestNotificationCbParams } from "~/ApwChangeRequestNotification";

export const sendChangeRequestNotification = async (
    params: ApwChangeRequestNotificationCbParams
): Promise<void> => {
    const { context, reviewers, contentReview } = params;

    const changeRequestPlugin = getLastChangeRequestNotificationPlugin({
        context,
        type: contentReview.content.type
    });
    if (!changeRequestPlugin) {
        return;
    }

    const body = changeRequestPlugin.create(params);
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
