import { createAbstraction } from "@webiny/feature/api";

export interface IRequestId {
    value: string;
}

/**
 * Identifier for the current request.
 *
 * `@webiny/handler` registers a generated value; runtimes that have a meaningful id of their own -
 * AWS Lambda, for instance - override it with theirs, so that a value reported to a client can be
 * correlated with the platform's own logs.
 */
export const RequestId = createAbstraction<IRequestId>("RequestId");

export namespace RequestId {
    export type Interface = IRequestId;
}
