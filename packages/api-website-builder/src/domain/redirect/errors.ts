import { BaseError } from "@webiny/feature/api";

export class RedirectModelNotFoundError extends BaseError {
    override readonly code = "WebsiteBuilder/Redirect/ModelNotFound" as const;

    constructor() {
        super({
            message: "Redirect model not found!"
        });
    }
}
