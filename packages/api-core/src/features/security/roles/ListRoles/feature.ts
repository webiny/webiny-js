import { createFeature } from "@webiny/feature/api";
import { ListRolesUseCase } from "./ListRolesUseCase.js";

export const ListRolesFeature = createFeature({
    name: "ListRoles",
    register(container) {
        container.register(ListRolesUseCase);
    }
});
