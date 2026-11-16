import { type IMailTransport, MailTransportFactory } from "~/domain/MailTransport/abstractions.js";
import { DummyMailTransport } from "./DummyMailTransport.js";
import { DUMMY_TRANSPORT_NAME } from "~/constants.js";

class DummyMailTransportFactoryImpl implements MailTransportFactory.Interface {
    public readonly name = DUMMY_TRANSPORT_NAME;

    canUse(): boolean {
        return true;
    }

    async createTransport(): Promise<IMailTransport> {
        return new DummyMailTransport();
    }
}

export const DummyMailTransportFactory = MailTransportFactory.createImplementation({
    implementation: DummyMailTransportFactoryImpl,
    dependencies: []
});
