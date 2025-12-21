import { MailTransport } from "~/domain/MailTransport/abstractions.js";

export class DummyMailTransport implements MailTransport.Interface {
    public readonly name = "Mailer/DummyTransport";

    constructor() {}

    async send() {
        return {
            result: true,
            error: null
        };
    }
}
