import { createFeature } from "@webiny/feature/api";
import { GetFlpUseCase } from "./GetFlpUseCase.js";

export const GetFlpFeature = createFeature({
    name: "GetFlpFeature",
    register(container) {
        container.register(GetFlpUseCase);
    }
});
