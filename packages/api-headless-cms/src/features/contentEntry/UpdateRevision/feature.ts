import { createFeature } from "@webiny/feature/api";
import { UpdateRevisionRepository } from "./UpdateRevisionRepository.js";

export const UpdateRevisionFeature = createFeature({
    name: "UpdateRevision",
    register(container) {
        container.register(UpdateRevisionRepository);
    }
});
