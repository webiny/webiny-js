import { createFeature } from "@webiny/feature/api";
import { PublishEntriesBulkAction } from "./PublishEntriesBulkAction.js";

export const PublishEntriesBulkActionFeature = createFeature({
    name: "HeadlessCms/BulkAction/PublishEntries",
    register(container) {
        container.register(PublishEntriesBulkAction);
    }
});
