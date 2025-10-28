import { BaseError } from "@webiny/feature/api";

export class CannotDeleteOwnAccountError extends BaseError {
    override readonly code = "CANNOT_DELETE_OWN_ACCOUNT" as const;

    constructor() {
        super({
            message: "You can't delete your own user account."
        });
    }
}
