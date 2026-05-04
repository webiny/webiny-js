import {
    ActiveTransport as ActiveTransportAbstraction,
    MailTransportFactory
} from "~/domain/MailTransport/abstractions.js";

class ActiveTransportImpl implements ActiveTransportAbstraction.Interface {
    constructor(private transportFactories: MailTransportFactory.Interface[]) {}

    name(): string | null {
        if (this.transportFactories.length === 0) {
            return null;
        }
        return this.transportFactories[this.transportFactories.length - 1].name;
    }
}

export const ActiveTransport = ActiveTransportAbstraction.createImplementation({
    implementation: ActiveTransportImpl,
    dependencies: [[MailTransportFactory, { multiple: true }]]
});
