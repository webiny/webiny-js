import { createFeature } from "@webiny/feature/admin";
import { ListCache } from "~/features/listCache/index.js";
import type { Role } from "../../types.js";
import { ListRolesUseCase as UseCaseAbstraction, RolesListCache } from "./abstractions.js";
import { ListRolesUseCase } from "./ListRolesUseCase.js";
import { ListRolesRepository } from "./ListRolesRepository.js";
import { ListRolesGateway } from "./ListRolesGateway.js";

export const ListRolesFeature = createFeature({
    name: "AccessManagement/ListRoles",
    register(container) {
        container.registerInstance(RolesListCache, new ListCache<Role>());
        container.register(ListRolesUseCase);
        container.register(ListRolesRepository).inSingletonScope();
        container.register(ListRolesGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
