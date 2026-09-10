import { createFeature } from "@webiny/feature/api";
import { IndexSettingsManager } from "~/settings/IndexSettingsManager.js";
import { IndexManagerFactory } from "~/indexManager/IndexManagerFactory.js";

export const SearchIndexTasksOsFeature = createFeature({
    name: "SearchIndexTasksOs",
    register(container) {
        container.register(IndexSettingsManager);
        container.register(IndexManagerFactory);
    }
});
