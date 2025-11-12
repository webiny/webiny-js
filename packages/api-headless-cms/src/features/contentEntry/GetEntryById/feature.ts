import { createFeature } from "@webiny/feature/api";
import { GetEntryByIdUseCase } from "./GetEntryByIdUseCase.js";

export const GetEntryByIdFeature = createFeature({
    name: "GetEntryById",
    register(container) {
        container.register(GetEntryByIdUseCase);
    }
});
