import { createFeature } from "@webiny/feature/admin";
import { FolderModelProvider as ProviderAbstraction } from "~/features/folders/abstractions.js";
import { FolderModelProvider } from "./FolderModelProvider.js";
import { GetFolderModelRepository } from "./GetFolderModelRepository.js";
import { GetFolderModelGqlGateway } from "./GetFolderModelGqlGateway.js";

export const FolderModelProviderFeature = createFeature({
    name: "FolderModelProvider",
    register(container) {
        container.register(FolderModelProvider);
        container.register(GetFolderModelRepository).inSingletonScope();
        container.register(GetFolderModelGqlGateway);
    },
    resolve(container) {
        return {
            provider: container.resolve(ProviderAbstraction)
        };
    }
});
