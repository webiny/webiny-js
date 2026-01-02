import { type IMailTransport, MailTransportFactory } from "~/domain/MailTransport/abstractions.js";
import { DummyMailTransport } from "./DummyMailTransport.js";

class DummyMailTransportFactoryImpl implements MailTransportFactory.Interface {
    async createTransport(): Promise<IMailTransport> {
        return new DummyMailTransport();
    }
}

export const DummyMailTransportFactory = MailTransportFactory.createImplementation({
    implementation: DummyMailTransportFactoryImpl,
    dependencies: []
});
