import { SendMailUseCase } from "@webiny/api-mailer/features/SendMail/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { MAIL_BCC_CHUNK_SIZE } from "~/features/notifications/shared/constants.js";
import { getErrorLogFields } from "~/features/notifications/shared/getErrorLogFields.js";
import { escapeHtml } from "~/features/notifications/shared/escapeHtml.js";
import { toSingleLine } from "~/domain/notifications/toSingleLine.js";
import { NotificationTransport } from "./abstractions.js";

/** Exactly one "@" with text on both sides; no whitespace, comma, semicolon or angle bracket. */
const PLAIN_ADDRESS = /^[^@\s,;<>]+@[^@\s,;<>]+$/;

const SEND_FAILURE_LOG = "Could not send a workflow notification e-mail.";

class MailNotificationTransportImpl implements NotificationTransport.Interface {
    public readonly id = "e-mail";
    public readonly title = "E-Mail";
    public readonly description = "Sends an e-mail to the people who need to act.";

    public constructor(
        private sendMail: SendMailUseCase.Interface,
        private logger: Logger.Interface
    ) {}

    public async send(params: NotificationTransport.SendParams): Promise<void> {
        const { users, message } = params;

        // An external IdP user can have its identity id as `email`; only plain addresses get
        // mail: exactly one "@" with text on both sides, no whitespace, comma, semicolon or angle
        // bracket. An address used by several users is sent once.
        const seen = new Set<string>();
        const recipients = users.filter(user => {
            if (typeof user.email !== "string" || !PLAIN_ADDRESS.test(user.email)) {
                return false;
            }
            if (seen.has(user.email)) {
                return false;
            }
            seen.add(user.email);
            return true;
        });
        if (recipients.length === 0) {
            return;
        }

        const subject = toSingleLine(message.title);
        let text = message.body;
        let html = `<p>${escapeHtml(message.body).replace(/\n/g, "<br/>")}</p>`;
        if (message.url !== null) {
            text = `${message.body}\n\n${message.linkLabel}: ${message.url}`;
            html += `<p><a href="${escapeHtml(message.url)}">${escapeHtml(message.linkLabel)}</a></p>`;
        }

        for (let start = 0; start < recipients.length; start += MAIL_BCC_CHUNK_SIZE) {
            const chunk = recipients.slice(start, start + MAIL_BCC_CHUNK_SIZE);
            // Bare addresses only: no display name, so no quoting or header injection (R193).
            const bcc = chunk.map(user => user.email);
            const userIds = chunk.map(user => user.id);
            try {
                // oxlint-disable-next-line no-await-in-loop -- one mail per BCC chunk.
                const result = await this.sendMail.execute({ bcc, subject, text, html });
                if (result.isFail()) {
                    this.logger.error(
                        {
                            ...getErrorLogFields(result.error),
                            userIds
                        },
                        SEND_FAILURE_LOG
                    );
                }
            } catch (error) {
                this.logger.error(
                    {
                        ...getErrorLogFields(error),
                        userIds
                    },
                    SEND_FAILURE_LOG
                );
            }
        }
    }
}

export const MailNotificationTransport = NotificationTransport.createImplementation({
    implementation: MailNotificationTransportImpl,
    dependencies: [SendMailUseCase, Logger]
});
