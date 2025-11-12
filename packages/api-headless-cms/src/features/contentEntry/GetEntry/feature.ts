import { createFeature } from "@webiny/feature/api";
import { GetEntryUseCase } from "./GetEntryUseCase.js";

export const GetEntryFeature = createFeature({
    name: "GetEntry",
    register(container) {
        container.register(GetEntryUseCase);
    }
});
