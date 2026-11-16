import { MailTransport } from "~/domain/MailTransport/abstractions.js";
import { DUMMY_TRANSPORT_NAME } from "~/constants.js";

export class DummyMailTransport implements MailTransport.Interface {
    public readonly name = DUMMY_TRANSPORT_NAME;

    constructor() {}

    async send() {
        return {
            result: true,
            error: null
        };
    }
}
