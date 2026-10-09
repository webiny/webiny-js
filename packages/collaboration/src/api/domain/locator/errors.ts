import { BaseError } from "@webiny/feature/api";

export class CollabResolverNotFoundError extends BaseError<{ contentType: string }> {
    override readonly code = "Collaboration/Resolver/NotFound" as const;

    constructor(contentType: string) {
        super({
            message: `No collaboration locator resolver is registered for content type "${contentType}".`,
            data: { contentType }
        });
    }
}
