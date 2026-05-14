import { createFeature } from "@webiny/feature/admin";
import { FileModelProvider } from "./FileModelProvider.js";
import { GetFileModelRepository } from "./GetFileModelRepository.js";
import { GetFileModelGqlGateway } from "./GetFileModelGqlGateway.js";

export const FileModelProviderFeature = createFeature({
    name: "FileModelProvider",
    register(container) {
        container.register(FileModelProvider);
        container.register(GetFileModelRepository).inSingletonScope();
        container.register(GetFileModelGqlGateway);
    }
});
