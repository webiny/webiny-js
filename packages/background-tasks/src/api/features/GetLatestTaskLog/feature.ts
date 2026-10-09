import { createFeature } from "@webiny/feature/api";
import { GetLatestTaskLogUseCase } from "./GetLatestTaskLogUseCase.js";

export const GetLatestTaskLogFeature = createFeature({
    name: "GetLatestTaskLog",
    register(container) {
        container.register(GetLatestTaskLogUseCase);
    }
});
