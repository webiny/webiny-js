import { type IMailTransport, MailTransportFactory } from "~/domain/MailTransport/abstractions.js";
import { DummyMailTransport } from "./DummyMailTransport.js";

class DummyMailTransportFactoryImpl implements MailTransportFactory.Interface {
    public readonly name = "Mailer/DummyTransport";

    async createTransport(): Promise<IMailTransport> {
        return new DummyMailTransport();
    }
}

export const DummyMailTransportFactory = MailTransportFactory.createImplementation({
    implementation: DummyMailTransportFactoryImpl,
    dependencies: []
});
