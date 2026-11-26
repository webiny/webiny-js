import { createFeature } from "@webiny/feature/api";
import ListTenantsUseCase from "./ListTenantsUseCase.js";
import ListTenantsRepository from "./ListTenantsRepository.js";

export const ListTenantsFeature = createFeature({
    name: "ListTenants",
    register(container) {
        container.register(ListTenantsUseCase);
        container.register(ListTenantsRepository);
    }
});
