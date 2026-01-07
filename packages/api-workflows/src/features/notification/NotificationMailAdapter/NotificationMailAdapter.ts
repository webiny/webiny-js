import { MailerService } from "@webiny/api-mailer";
import type { NotificationMessageBodyConverter } from "~/domain/notification/abstractions.js";
import { NotificationAdapter } from "~/domain/notification/abstractions.js";

class NotificationMailAdapterImpl implements NotificationAdapter.Interface {
    public readonly id = "e-mail";
    public readonly title = "E-Mail";

    private readonly mailer: MailerService.Interface;

    public constructor(mailer: MailerService.Interface) {
        this.mailer = mailer;
    }

    public getMessageBodyConverter(): NotificationMessageBodyConverter.Interface | null {
        return null;
    }

    public async send(params: NotificationAdapter.Params): Promise<void> {
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

export const NotificationMailAdapter = NotificationAdapter.createImplementation({
    implementation: NotificationMailAdapterImpl,
    dependencies: [MailerService]
});
