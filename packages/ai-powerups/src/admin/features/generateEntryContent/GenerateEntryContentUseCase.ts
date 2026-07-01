import {
    GenerateEntryContentUseCase as UseCaseAbstraction,
    GenerateEntryContentGateway
} from "./abstractions.js";
import type { GenerateEntryContentParams } from "./abstractions.js";

class GenerateEntryContentUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private gateway: GenerateEntryContentGateway.Interface) {}

    async execute(params: GenerateEntryContentParams): Promise<void> {
        return this.gateway.execute(params);
    }
}

export const GenerateEntryContentUseCase = UseCaseAbstraction.createImplementation({
    implementation: GenerateEntryContentUseCaseImpl,
    dependencies: [GenerateEntryContentGateway]
});
