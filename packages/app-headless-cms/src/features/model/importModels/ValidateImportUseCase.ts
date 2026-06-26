import {
    ValidateImportUseCase as UseCaseAbstraction,
    ValidateImportGateway
} from "./abstractions.js";
import type { ImportStructureVariables } from "~/presentation/importContentModels/graphql.js";

class ValidateImportUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private gateway: ValidateImportGateway.Interface) {}

    async execute(data: ImportStructureVariables["data"]) {
        return this.gateway.execute(data);
    }
}

export const ValidateImportUseCase = UseCaseAbstraction.createImplementation({
    implementation: ValidateImportUseCaseImpl,
    dependencies: [ValidateImportGateway]
});
