import { DeliveringTransport as Abstraction } from "~/domain/MailTransport/abstractions.js";
import { MailTransportResolver } from "~/domain/MailTransport/abstractions.js";
import { DUMMY_TRANSPORT_NAME } from "~/constants.js";

class DeliveringTransportImpl implements Abstraction.Interface {
    constructor(private transportResolver: MailTransportResolver.Interface) {}

    async resolve(): Promise<Abstraction.Resolved | null> {
        const resolved = await this.transportResolver.resolve();
        if (!resolved || resolved.factory.name === DUMMY_TRANSPORT_NAME) {
            return null;
        }

        return {
            name: resolved.factory.name,
            from: resolved.settings?.from || undefined,
            replyTo: resolved.settings?.replyTo || undefined
        };
    }
}

export const DeliveringTransport = Abstraction.createImplementation({
    implementation: DeliveringTransportImpl,
    dependencies: [MailTransportResolver]
});
