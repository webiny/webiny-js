import { ExportModelsUseCase as UseCaseAbstraction, ExportModelsGateway } from "./abstractions.js";

class ExportModelsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private gateway: ExportModelsGateway.Interface) {}

    async execute(models?: string[]) {
        const result = await this.gateway.execute(models);
        try {
            return JSON.parse(result);
        } catch (ex) {
            console.error(ex);
            return null;
        }
    }
}

export const ExportModelsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ExportModelsUseCaseImpl,
    dependencies: [ExportModelsGateway]
});
