export class IndexSettingsGetError extends Error {
    public readonly index: string;
    constructor(cause: unknown, index: string) {
        super(`Failed to get settings for index "${index}".`);
        this.index = index;
        this.cause = cause;
    }
}
