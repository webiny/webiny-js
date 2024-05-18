export class GracefulPulumiError extends Error {
    static from(e: Error, context: Record<string, any>): GracefulPulumiError | undefined;
}
