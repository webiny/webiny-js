import { BaseError } from "@webiny/feature/api/index.js";

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
