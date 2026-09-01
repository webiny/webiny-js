import { ImportModelsUseCase as UseCaseAbstraction, ImportModelsGateway } from "./abstractions.js";
import type { ImportStructureVariables } from "~/presentation/importContentModels/graphql.js";

class ImportModelsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private gateway: ImportModelsGateway.Interface) {}

    async execute(data: ImportStructureVariables["data"]) {
        return this.gateway.execute(data);
    }
}

export const ImportModelsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ImportModelsUseCaseImpl,
    dependencies: [ImportModelsGateway]
});
