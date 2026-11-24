import { SendTestMailUseCase as UseCaseAbstraction } from "./abstractions.js";
import { SendTestMailGateway } from "./abstractions.js";

class SendTestMailUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private gateway: SendTestMailGateway.Interface) {}

    execute(to: string): Promise<void> {
        return this.gateway.execute(to);
    }
}

export const SendTestMailUseCase = UseCaseAbstraction.createImplementation({
    implementation: SendTestMailUseCaseImpl,
    dependencies: [SendTestMailGateway]
});
