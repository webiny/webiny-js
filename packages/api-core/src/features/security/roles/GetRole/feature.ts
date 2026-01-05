import { createFeature } from "@webiny/feature/api";
import { GetRoleUseCase } from "./GetRoleUseCase.js";

export const GetRoleFeature = createFeature({
    name: "GetRole",
    register(container) {
        container.register(GetRoleUseCase);
    }
});
