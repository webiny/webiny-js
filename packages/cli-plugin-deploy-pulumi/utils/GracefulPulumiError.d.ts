export class GracefulPulumiError extends Error {
    static from(e: Error): GracefulPulumiError | undefined;
}
