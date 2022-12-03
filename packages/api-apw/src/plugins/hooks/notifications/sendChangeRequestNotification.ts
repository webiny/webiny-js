import { getLastChangeRequestNotificationPlugin } from "./lastChangeRequestNotificationPlugin";
import { ApwChangeRequestNotificationCbParams } from "~/ApwChangeRequestNotification";

export const sendChangeRequestNotification = async (
    params: ApwChangeRequestNotificationCbParams
): Promise<void> => {
    const { context, reviewers, contentReview } = params;
    if (reviewers.length === 0) {
        return;
    }

    const changeRequestPlugin = getLastChangeRequestNotificationPlugin({
        context,
        type: contentReview.content.type
    });
    if (!changeRequestPlugin) {
        console.log("No e-mail body change request plugin.");
        return;
    }

    const body = changeRequestPlugin.create(params);
    if (!body) {
        console.log(`No e-mail body from the change request plugin: ${changeRequestPlugin.name}`);
        return;
    }

    const result = await context.mailer.sendMail({
        bcc: reviewers.map(r => r.email),
        subject: "There is a new change request on the Content Review you are assigned on.",
        text: body.text,
        html: body.html || body.text
    });
    if (!result.error) {
        return;
    }
    console.log("Error while sending e-mail", JSON.stringify(result.error));
};
