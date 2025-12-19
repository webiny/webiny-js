import { BaseError } from "@webiny/feature/api";

export class FolderNotFoundError extends BaseError<{ folder: { id: string } }> {
    override readonly code = "Aco/Folder/NotFound" as const;

    constructor(id: string) {
        super({
            message: "Folder not found!",
            data: {
                folder: {
                    id
                }
            }
        });
    }
}

export class FolderNotAuthorizedError extends BaseError {
    override readonly code = "Aco/Folder/NotAuthorizedError" as const;

    constructor() {
        super({
            message: `Not authorized.`
        });
    }
}

export class FolderPersistenceError extends BaseError {
    override readonly code = "Aco/Folder/PersistenceError" as const;

    constructor(error: Error) {
        super({
            message: error.message
        });
    }
}

export class FolderValidationError extends BaseError {
    override readonly code = "Aco/Folder/ValidationError" as const;

    constructor(message: string) {
        super({
            message
        });
    }
}

export class FolderCannotMoveToNewParent extends BaseError {
    override readonly code = "Aco/Folder/CannotMoveToNewParent" as const;

    constructor() {
        super({
            message: `Cannot move folder to a new parent because you don't have access to the new parent.`
        });
    }
}

export class FolderNotEmptyError extends BaseError {
    override readonly code = "Aco/Folder/NotEmpty" as const;

    constructor() {
        super({
            message: `Folder is not empty.`
        });
    }
}
