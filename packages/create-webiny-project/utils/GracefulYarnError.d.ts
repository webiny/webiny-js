export class GracefulYarnError extends Error {
    static from(e: Error, context: Record<string, any>): GracefulYarnError | undefined;
}
