import { createFeature } from "@webiny/feature/admin";
import { ListUsersWhoCanReadEntriesUseCase as UseCase } from "./abstractions.js";
import { ListUsersWhoCanReadEntriesUseCase } from "./ListUsersWhoCanReadEntriesUseCase.js";
import { ListUsersWhoCanReadEntriesGateway } from "./ListUsersWhoCanReadEntriesGateway.js";

export const ListUsersWhoCanReadEntriesFeature = createFeature({
    name: "CmsContentEntry/ListUsersWhoCanReadEntries",
    register(container) {
        container.register(ListUsersWhoCanReadEntriesUseCase);
        container.register(ListUsersWhoCanReadEntriesGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase)
        };
    }
});
