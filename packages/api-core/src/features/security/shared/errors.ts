import { BaseError } from "@webiny/feature/api";

type ErrorInput = {
    message?: string;
    data?: Record<string, any>;
};

export class NotAuthorizedError extends BaseError<Record<string, any> | undefined> {
    override readonly code = "NOT_AUTHORIZED" as const;

    constructor(input?: ErrorInput) {
        super({
            message: input?.message || "Not authorized!",
            data: input?.data
        });
    }
}
