import { createFeature } from "@webiny/feature/api";
import { RestoreEntriesBulkAction } from "./RestoreEntriesBulkAction.js";

export const RestoreEntriesBulkActionFeature = createFeature({
    name: "HeadlessCms/BulkAction/RestoreEntries",
    register(container) {
        container.register(RestoreEntriesBulkAction);
    }
});
