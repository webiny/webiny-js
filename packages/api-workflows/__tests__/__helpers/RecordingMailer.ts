import { BaseError, Result } from "@webiny/feature/api";
import type { MailerService } from "@webiny/api-mailer";

export type SentMail = Parameters<MailerService.Interface["sendMail"]>[0];

class SmtpFailure extends BaseError {
    override readonly code = "Mailer/MailerService/TransportSendError" as const;

    public constructor(message: string) {
        super({ message });
    }
}

/**
 * Records every mail instead of sending it. `failOn` makes the calls with those indexes return a
 * failed Result, `throwOn` makes them throw (an error that carries a `code`), both by call index.
 * Register with `container.registerInstance(MailerService, mailer)`.
 */
export class RecordingMailer implements MailerService.Interface {
    public readonly sent: SentMail[] = [];
    public failOn: number[] = [];
    public throwOn: number[] = [];
    public failureMessage = "SMTP refused.";

    public async sendMail<T = any>(data: SentMail): MailerService.Return<T> {
        const index = this.sent.length;
        this.sent.push(data);
        if (this.throwOn.includes(index)) {
            throw Object.assign(new Error(this.failureMessage), { code: "ECONNRESET" });
        }
        if (this.failOn.includes(index)) {
            return Result.fail(new SmtpFailure(this.failureMessage) as never);
        }
        return Result.ok({ result: null, error: null });
    }
}
