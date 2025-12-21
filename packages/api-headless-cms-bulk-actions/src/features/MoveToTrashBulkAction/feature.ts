import { createFeature } from "@webiny/feature/api";
import { MoveToTrashBulkAction } from "./MoveToTrashBulkAction.js";

export const MoveToTrashBulkActionFeature = createFeature({
    name: "HeadlessCms/BulkAction/MoveToTrash",
    register(container) {
        container.register(MoveToTrashBulkAction);
    }
});
