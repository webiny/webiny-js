import {
    GeneratePageContentUseCase as UseCaseAbstraction,
    GeneratePageContentGateway
} from "./abstractions.js";
import type { GeneratePageContentParams } from "./abstractions.js";

class GeneratePageContentUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private gateway: GeneratePageContentGateway.Interface) {}

    async execute(params: GeneratePageContentParams): Promise<void> {
        return this.gateway.execute(params);
    }
}

export const GeneratePageContentUseCase = UseCaseAbstraction.createImplementation({
    implementation: GeneratePageContentUseCaseImpl,
    dependencies: [GeneratePageContentGateway]
});
