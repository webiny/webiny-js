import { createFeature } from "@webiny/feature/admin";
import { DeletePageUseCaseReviewDecorator } from "./DeletePageUseCaseReviewDecorator.js";
import { DeletePageRevisionUseCaseReviewDecorator } from "./DeletePageRevisionUseCaseReviewDecorator.js";
import { BulkDeletePresenterReviewDecorator } from "./BulkDeletePresenterReviewDecorator.js";

export const WbReviewTrashFeature = createFeature({
    name: "WebsiteBuilderWorkflows/Trash",
    register(container) {
        container.registerDecorator(DeletePageUseCaseReviewDecorator);
        container.registerDecorator(DeletePageRevisionUseCaseReviewDecorator);
        container.registerDecorator(BulkDeletePresenterReviewDecorator);
    }
});
