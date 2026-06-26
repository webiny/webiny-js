import { ExportModelsUseCase as UseCaseAbstraction, ExportModelsGateway } from "./abstractions.js";

class ExportModelsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private gateway: ExportModelsGateway.Interface) {}

    async execute(models?: string[]) {
        return this.gateway.execute(models);
    }
}

export const ExportModelsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ExportModelsUseCaseImpl,
    dependencies: [ExportModelsGateway]
});
