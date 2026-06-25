import { createFeature } from "@webiny/feature/admin";
import { ValidateImportUseCase as ValidateUseCase } from "./abstractions.js";
import { ImportModelsUseCase as ImportUseCase } from "./abstractions.js";
import { ValidateImportUseCase } from "./ValidateImportUseCase.js";
import { ValidateImportGateway } from "./ValidateImportGateway.js";
import { ImportModelsUseCase } from "./ImportModelsUseCase.js";
import { ImportModelsGateway } from "./ImportModelsGateway.js";

export const ImportModelsFeature = createFeature({
    name: "CmsModel/ImportModels",
    register(container) {
        container.register(ValidateImportUseCase);
        container.register(ValidateImportGateway).inSingletonScope();
        container.register(ImportModelsUseCase);
        container.register(ImportModelsGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            validateUseCase: container.resolve(ValidateUseCase),
            importUseCase: container.resolve(ImportUseCase)
        };
    }
});
