import { Result } from "@webiny/feature/api";
import type { MailerService } from "@webiny/api-mailer";

/** A mailer that sends nothing: the notification handlers need one to resolve (Task 12). */
export class InertMailer implements MailerService.Interface {
    public async sendMail<T = any>(): MailerService.Return<T> {
        return Result.ok({ result: null, error: null });
    }
}
