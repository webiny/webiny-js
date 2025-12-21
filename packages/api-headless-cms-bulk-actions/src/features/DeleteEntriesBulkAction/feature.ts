import { createFeature } from "@webiny/feature/api";
import { DeleteEntriesBulkAction } from "./DeleteEntriesBulkAction.js";

export const DeleteEntriesBulkActionFeature = createFeature({
    name: "HeadlessCms/BulkAction/DeleteEntries",
    register(container) {
        container.register(DeleteEntriesBulkAction);
    }
});
