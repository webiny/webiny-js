import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di-container";
import { ListTenantsUseCase } from "./ListTenantsUseCase.js";
import { ListTenantsRepository } from "./ListTenantsRepository.js";
import { ListTenantsGateway } from "./ListTenantsGateway.js";

export const ListTenantsFeature = createFeature({
    name: "ListTenants",
    register(container: Container) {
        container.register(ListTenantsUseCase);
        container.register(ListTenantsRepository).inSingletonScope();
        container.register(ListTenantsGateway).inSingletonScope();
    }
});
