import { MailerService } from "@webiny/api-mailer";
import { NotificationTransport } from "./abstractions.js";

class MailNotificationTransportImpl implements NotificationTransport.Interface {
    public readonly id = "e-mail";
    public readonly title = "E-Mail";

    private readonly mailer: MailerService.Interface;

    public constructor(mailer: MailerService.Interface) {
        this.mailer = mailer;
    }

    public async send(params: NotificationTransport.SendParams): Promise<void> {
        const { users, message } = params;

        const bcc = users
            .map(user => {
                if (!user.displayName) {
                    return user.email;
                }
                return `"${user.displayName}" <${user.email}>`;
            })
            /**
             * Just in case...
             */
            .filter(user => !!user);

        if (bcc.length === 0) {
            return;
        }

        const result = await this.mailer.sendMail({
            bcc,
            subject: message.title,
            text: message.body,
            html: `<p>${message.body.replace(/\n/g, "<br/>")}</p>`
        });
        if (result.isOk()) {
            return;
        }
        console.error({
            message: "Failed to send e-mail notification.",
            error: result.error,
            users: users.map(u => u.email)
        });
    }
}

export const MailNotificationTransport = NotificationTransport.createImplementation({
    implementation: MailNotificationTransportImpl,
    dependencies: [MailerService]
});
