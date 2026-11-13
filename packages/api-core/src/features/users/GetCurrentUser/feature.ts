import { createFeature } from "@webiny/feature/api";
import { GetCurrentUserUseCase } from "./GetCurrentUserUseCase.js";

export const GetCurrentUserFeature = createFeature({
    name: "GetCurrentUser",
    register(container) {
        container.register(GetCurrentUserUseCase);
    }
});
