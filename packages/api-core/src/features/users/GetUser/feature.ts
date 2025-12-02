import { createFeature } from "@webiny/feature/api";
import { GetUserUseCase } from "./GetUserUseCase.js";

export const GetUserFeature = createFeature({
    name: "GetUser",
    register(container) {
        container.register(GetUserUseCase);
    }
});
