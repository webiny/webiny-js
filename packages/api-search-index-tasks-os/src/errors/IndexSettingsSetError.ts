export class IndexSettingsSetError extends Error {
    public readonly index: string;
    constructor(cause: unknown, index: string) {
        super(`Failed to set settings for index "${index}".`);
        this.index = index;
        this.cause = cause;
    }
}
