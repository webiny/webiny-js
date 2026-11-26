import { AsyncLocalStorage } from "node:async_hooks";
import { HttpStreamBody } from "@webiny/api-kernel-core";
import type { HttpStreamChunk } from "@webiny/api-kernel-core";

/**
 * A streamed body that is read in the tenant scope it was created in.
 *
 * The transport reads a stream after the router has returned, so outside the scope's callback. Its
 * chunks are produced by the route's services (an AI provider, a use case), which belong to the
 * scope and throw `StaleKernelExecutionError` outside it. Call this inside the scope's callback: each
 * read then runs in the async context captured here, the scope's.
 *
 * `onEnd` is called once, when the stream is fully read, fails, or the reader stops early.
 */
export function readStreamInScope(body: HttpStreamBody, onEnd: () => void): HttpStreamBody {
    const runInScope = AsyncLocalStorage.snapshot();

    let ended = false;
    const end = () => {
        if (!ended) {
            ended = true;
            onEnd();
        }
    };

    return new HttpStreamBody({
        [Symbol.asyncIterator](): AsyncIterator<HttpStreamChunk> {
            const iterator = runInScope(() => body.source[Symbol.asyncIterator]());
            return {
                async next() {
                    try {
                        const result = await runInScope(() => iterator.next());
                        if (result.done) {
                            end();
                        }
                        return result;
                    } catch (error) {
                        end();
                        throw error;
                    }
                },
                async return(value?: any) {
                    try {
                        if (iterator.return) {
                            return await runInScope(() => iterator.return!(value));
                        }
                        return { done: true, value };
                    } finally {
                        end();
                    }
                }
            };
        }
    });
}
