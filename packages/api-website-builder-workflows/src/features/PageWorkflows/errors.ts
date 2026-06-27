import { BaseError } from "@webiny/feature/api";

export class PageMoveBlockedByWorkflowStateError extends BaseError<{
    pageId: string;
}> {
    override readonly code = "Workflows/Page/MoveBlockedByActiveState" as const;

    constructor(data: { pageId: string }) {
        super({
            message:
                "Cannot move page because it has an active content review. Cancel or complete the review first.",
            data
        });
    }
}
