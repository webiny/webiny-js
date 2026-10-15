import { BaseError } from "@webiny/feature/api";

/**
 * Deliberately says nothing about why.
 *
 * "You may not read timelines", "you may not read this entry" and "this entry does not exist" are
 * all this error, because distinguishing them tells an unauthorised caller things it should not
 * learn — including whether a target exists.
 */
export class ActivityLogNotAuthorizedError extends BaseError {
    override readonly code = "ActivityLog/NotAuthorized" as const;

    constructor() {
        super({ message: "Not authorized to read activity for this target." });
    }
}

export class ActivityLogTargetNotFoundError extends BaseError<{ targetId: string }> {
    override readonly code = "ActivityLog/TargetNotFound" as const;

    constructor(targetId: string) {
        super({
            message: `Target "${targetId}" was not found.`,
            data: { targetId }
        });
    }
}
