import { createFeature } from "@webiny/feature/admin";
import { ListCache } from "~/features/listCache/index.js";
import type { ApiKey } from "../../types.js";
import { ListApiKeysUseCase as UseCaseAbstraction, ApiKeysListCache } from "./abstractions.js";
import { ListApiKeysUseCase } from "./ListApiKeysUseCase.js";
import { ListApiKeysRepository } from "./ListApiKeysRepository.js";
import { ListApiKeysGateway } from "./ListApiKeysGateway.js";

export const ListApiKeysFeature = createFeature({
    name: "AccessManagement/ListApiKeys",
    register(container) {
        container.registerInstance(ApiKeysListCache, new ListCache<ApiKey>());
        container.register(ListApiKeysUseCase);
        container.register(ListApiKeysRepository).inSingletonScope();
        container.register(ListApiKeysGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
