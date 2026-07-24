import { createFeature } from "@webiny/feature/api";
import { IndexSettingsManager } from "~/settings/IndexSettingsManager.js";
import { IndexManagerFactory } from "~/indexManager/IndexManagerFactory.js";
import { DdbStorageScanner } from "~/storage/StorageScanner.js";
import { DdbStorageWriter } from "~/storage/StorageWriter.js";

export const SearchIndexTasksDdbOsFeature = createFeature({
    name: "SearchIndexTasksDdbOs",
    register(container) {
        container.register(DdbStorageScanner);
        container.register(DdbStorageWriter);
        container.register(IndexSettingsManager);
        container.register(IndexManagerFactory);
    }
});
