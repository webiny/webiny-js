import { createFeature } from "@webiny/feature/admin";
import { GetFolderExtensionsFieldsUseCase as UseCase } from "./abstractions.js";
import { GetFolderExtensionsFieldsUseCase } from "./GetFolderExtensionsFieldsUseCase.js";
import { GlobalNamespaceFilter } from "./filters/GlobalNamespaceFilter.js";
import { FmFileNamespaceFilter } from "./filters/FmFileNamespaceFilter.js";
import { CmsNamespaceFilter } from "./filters/CmsNamespaceFilter.js";

export const GetFolderExtensionsFieldsFeature = createFeature({
    name: "GetFolderExtensionsFields",
    register(container) {
        // Register base implementation
        container.register(GetFolderExtensionsFieldsUseCase);

        // Register all filters - they will all run and results will be combined
        container.register(GlobalNamespaceFilter);
        container.register(FmFileNamespaceFilter);
        container.register(CmsNamespaceFilter);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase)
        };
    }
});
