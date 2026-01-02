import { BaseError } from "@webiny/feature/api";

export class FilePersistenceError extends BaseError {
    override readonly code = "FileManager/File/PersistenceError" as const;

    constructor(error: Error) {
        super({
            message: error.message
        });
    }
}

export class FileNotFoundError extends BaseError<{ id: string }> {
    override readonly code = "FileManager/File/NotFoundError" as const;

    constructor(id: string) {
        super({
            message: `File with ID "${id}" not found.`,
            data: { id }
        });
    }
}

export class FileNotAuthorizedError extends BaseError {
    override readonly code = "FileManager/File/NotAuthorizedError" as const;

    constructor() {
        super({
            message: `Not authorized.`
        });
    }
}

export class FileListError extends BaseError {
    override readonly code = "FileManager/File/ListError" as const;

    constructor(error: Error) {
        super({
            message: `Error listing files: ${error.message}`
        });
    }
}

export class FileCreateError extends BaseError {
    override readonly code = "FileManager/File/CreateError" as const;

    constructor(error: Error) {
        super({
            message: `Error creating file: ${error.message}`
        });
    }
}

export class FileUpdateError extends BaseError {
    override readonly code = "FileManager/File/UpdateError" as const;

    constructor(error: Error) {
        super({
            message: `Error updating file: ${error.message}`
        });
    }
}

export class FileDeleteError extends BaseError {
    override readonly code = "FileManager/File/DeleteError" as const;

    constructor(error: Error) {
        super({
            message: `Error deleting file: ${error.message}`
        });
    }
}

export class FileAlreadyExistsError extends BaseError<{ key: string }> {
    override readonly code = "FileManager/File/AlreadyExistsError" as const;

    constructor(data: { key: string }) {
        super({
            message: `File with key "${data.key}" already exists.`,
            data
        });
    }
}

export class InvalidFileSizeError extends BaseError<{
    size: number;
    minSize: number;
    maxSize: number;
}> {
    override readonly code = "FileManager/File/InvalidFileSizeError" as const;

    constructor(data: { size: number; minSize: number; maxSize: number }) {
        super({
            message: `File size ${data.size} bytes is outside allowed range (${data.minSize}-${data.maxSize} bytes).`,
            data
        });
    }
}

export class InvalidFileTypeError extends BaseError<{ type: string }> {
    override readonly code = "FileManager/File/InvalidFileTypeError" as const;

    constructor(data: { type: string }) {
        super({
            message: `File type "${data.type}" is not allowed.`,
            data
        });
    }
}
