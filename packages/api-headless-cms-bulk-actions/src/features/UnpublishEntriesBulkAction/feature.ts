import { createFeature } from "@webiny/feature/api";
import { UnpublishEntriesBulkAction } from "./UnpublishEntriesBulkAction.js";

export const UnpublishEntriesBulkActionFeature = createFeature({
    name: "HeadlessCms/BulkAction/UnpublishEntries",
    register(container) {
        container.register(UnpublishEntriesBulkAction);
    }
});
