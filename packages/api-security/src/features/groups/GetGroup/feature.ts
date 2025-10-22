import { createFeature } from "@webiny/feature/api";
import { GetGroupUseCaseImpl } from "./GetGroupUseCase.js";

export const GetGroupFeature = createFeature({
    name: "GetGroup",
    register(container) {
        container.register(GetGroupUseCaseImpl);
    }
});
