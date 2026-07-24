import { createFeature } from "@webiny/feature/api";
import { SearchIndexTasksOsFeature } from "@webiny/api-search-index-tasks-os";
import { DdbStorageScanner } from "~/storage/StorageScanner.js";
import { DdbStorageWriter } from "~/storage/StorageWriter.js";

export const SearchIndexTasksDdbOsFeature = createFeature({
    name: "SearchIndexTasksDdbOs",
    register(container) {
        SearchIndexTasksOsFeature.register(container);
        container.register(DdbStorageScanner);
        container.register(DdbStorageWriter);
    }
});
