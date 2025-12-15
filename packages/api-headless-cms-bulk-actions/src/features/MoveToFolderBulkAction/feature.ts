import { createFeature } from "@webiny/feature/api";
import { MoveToFolderBulkAction } from "./MoveToFolderBulkAction.js";

export const MoveToFolderBulkActionFeature = createFeature({
    name: "HeadlessCms/BulkAction/MoveToFolder",
    register(container) {
        container.register(MoveToFolderBulkAction);
    }
});
