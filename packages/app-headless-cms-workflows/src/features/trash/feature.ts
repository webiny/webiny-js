import { createFeature } from "@webiny/feature/admin";
import { DeleteEntryUseCaseReviewDecorator } from "./DeleteEntryUseCaseReviewDecorator.js";
import { DeleteEntryRevisionUseCaseReviewDecorator } from "./DeleteEntryRevisionUseCaseReviewDecorator.js";
import { PermanentlyDeleteEntryUseCaseReviewDecorator } from "./PermanentlyDeleteEntryUseCaseReviewDecorator.js";
import { BulkDeletePresenterReviewDecorator } from "./BulkDeletePresenterReviewDecorator.js";

export const CmsReviewTrashFeature = createFeature({
    name: "CmsWorkflows/Trash",
    register(container) {
        container.registerDecorator(DeleteEntryUseCaseReviewDecorator);
        container.registerDecorator(DeleteEntryRevisionUseCaseReviewDecorator);
        container.registerDecorator(PermanentlyDeleteEntryUseCaseReviewDecorator);
        container.registerDecorator(BulkDeletePresenterReviewDecorator);
    }
});
