import { createFeature } from "@webiny/feature/api";
import { CmsEntryFolderExistsUseCase } from "./CmsEntryFolderExistsUseCase.js";

export const CmsEntryFolderExistsFeature = createFeature({
    name: "CmsWorkflows/CmsEntryFolderExists",
    register(container) {
        container.register(CmsEntryFolderExistsUseCase);
    }
});
