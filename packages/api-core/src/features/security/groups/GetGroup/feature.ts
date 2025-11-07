import { createFeature } from "@webiny/feature/api";
import { GetGroupUseCase } from "./GetGroupUseCase.js";

export const GetGroupFeature = createFeature({
    name: "GetGroup",
    register(container) {
        container.register(GetGroupUseCase);
    }
});
