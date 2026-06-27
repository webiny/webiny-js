import { BaseError } from "@webiny/feature/api";

export class EntryMoveBlockedByWorkflowStateError extends BaseError<{
    app: string;
    entryId: string;
}> {
    override readonly code = "Workflows/Entry/MoveBlockedByActiveState" as const;

    constructor(data: { app: string; entryId: string }) {
        super({
            message:
                "Cannot move entry because it has an active content review. Cancel or complete the review first.",
            data
        });
    }
}
