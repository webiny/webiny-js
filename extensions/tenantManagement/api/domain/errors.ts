import { BaseError } from "@webiny/feature/api";

export class CompanyNotFoundError extends BaseError {
    override readonly code = "Company/NotFound" as const;

    constructor(id: string) {
        super({ message: `Company with id "${id}" was not found!` });
    }
}

export class CompanyPersistenceError extends BaseError {
    override readonly code = "Company/Persistence" as const;

    constructor(error: Error) {
        super({ message: error.message });
    }
}

export class TenantCreationError extends BaseError {
    override readonly code = "Tenant/Creation" as const;

    constructor(error: Error) {
        super({ message: `Failed to create tenant: ${error.message}` });
    }
}

export class TenantInstallationError extends BaseError {
    override readonly code = "Tenant/Installation" as const;

    constructor(error: Error) {
        super({ message: `Failed to install tenant: ${error.message}` });
    }
}

export class CompanyUpdateError extends BaseError {
    override readonly code = "Company/Update" as const;

    constructor(error: Error) {
        super({ message: `Failed to update company: ${error.message}` });
    }
}
