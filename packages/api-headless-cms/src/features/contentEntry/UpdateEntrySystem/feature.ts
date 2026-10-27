import { createFeature } from "@webiny/feature/api";
import { UpdateEntrySystemUseCase } from "./UpdateEntrySystemUseCase.js";

export const UpdateEntrySystemFeature = createFeature({
    name: "UpdateEntrySystem",
    register(container) {
        container.register(UpdateEntrySystemUseCase);
    }
});
