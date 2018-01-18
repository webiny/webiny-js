// @flow

class StorageError extends Error {
    code: string | null;
    data: any;

    constructor(message: string, code?: string, data?: any) {
        super();
        this.name = 'StorageError';
        this.message = message;
        this.code = code || null;
        this.data = data;
        Error.captureStackTrace(this, this.constructor);
    }
}

export default StorageError;