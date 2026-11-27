import { BaseError } from "@webiny/feature/api";

/** The request container builds its tenant registry, but no storage for it is registered. */
export class MissingTenancyStorageOperationsError extends BaseError {
    override readonly code = "Tenancy/MissingStorageOperations" as const;

    constructor() {
        super({
            message:
                "No storage for the tenant registry: register a TenancyStorageOperationsFactory (or an ApiCoreStorageOperationsFactory) before the request container registers its tenant registry."
        });
    }
}
