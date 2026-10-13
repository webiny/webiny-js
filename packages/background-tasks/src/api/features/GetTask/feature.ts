import { createFeature } from "@webiny/feature/api";
import { GetTaskUseCase } from "./GetTaskUseCase.js";

export const GetTaskFeature = createFeature({
    name: "GetTask",
    register(container) {
        container.register(GetTaskUseCase);
    }
});
