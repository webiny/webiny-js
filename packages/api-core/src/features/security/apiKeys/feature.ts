import { createFeature } from "@webiny/feature/api";
import { ApiKeysRepository } from "./shared/ApiKeysRepository.js";
import { GetApiKeyFeature } from "./GetApiKey/feature.js";
import { GetApiKeyByTokenFeature } from "./GetApiKeyByToken/feature.js";
import { ListApiKeysFeature } from "./ListApiKeys/feature.js";
import { CreateApiKeyFeature } from "./CreateApiKey/feature.js";
import { UpdateApiKeyFeature } from "./UpdateApiKey/feature.js";
import { DeleteApiKeyFeature } from "./DeleteApiKey/feature.js";

export const ApiKeysFeature = createFeature({
    name: "ApiKeys",
    register(container) {
        // Register repository in singleton scope
        container.register(ApiKeysRepository).inSingletonScope();

        // Register all use cases
        GetApiKeyFeature.register(container);
        GetApiKeyByTokenFeature.register(container);
        ListApiKeysFeature.register(container);
        CreateApiKeyFeature.register(container);
        UpdateApiKeyFeature.register(container);
        DeleteApiKeyFeature.register(container);
    }
});
