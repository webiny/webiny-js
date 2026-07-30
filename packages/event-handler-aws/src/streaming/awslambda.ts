/**
 * Minimal typings + accessor for the `awslambda` global, which the AWS Lambda Node.js runtime injects
 * when a function is invoked with `InvokeMode: RESPONSE_STREAM`. It has no npm package and no ambient
 * types, so it is declared here rather than as a global — that keeps the leakage contained and lets
 * tests stub `globalThis.awslambda`.
 */

export interface IRawResponseStream {
    write(chunk: Uint8Array | string): boolean | void;
    end(): void;
    destroy?(error?: Error): void;
    /** Present when the runtime hands over a Node `Writable`; used to await back-pressure. */
    once?(event: string, listener: () => void): unknown;
    destroyed?: boolean;
}

export interface IResponseStreamMetadata {
    statusCode: number;
    headers?: Record<string, string>;
    cookies?: string[];
}

export interface IAwsLambdaGlobal {
    /**
     * Marks a handler as streaming. The runtime then calls it as
     * `(event, responseStream, context)` instead of `(event, context)`.
     */
    streamifyResponse<THandler extends (...args: any[]) => any>(handler: THandler): THandler;
    HttpResponseStream: {
        /**
         * Wraps the raw stream so the status code and headers are sent as a prelude. Must be called
         * before the first `write`, otherwise the response defaults to 200 with no headers.
         */
        from(stream: IRawResponseStream, metadata: IResponseStreamMetadata): IRawResponseStream;
    };
}

export function getAwsLambdaGlobal(): IAwsLambdaGlobal {
    const global = (globalThis as any).awslambda as IAwsLambdaGlobal | undefined;

    if (!global) {
        throw new Error(
            "The `awslambda` global is not available. Response streaming only works in the AWS " +
                "Lambda Node.js runtime, on a function invoked through a Function URL with " +
                "`InvokeMode: RESPONSE_STREAM`."
        );
    }

    return global;
}

export function isAwsLambdaStreamingRuntime(): boolean {
    return Boolean((globalThis as any).awslambda);
}
