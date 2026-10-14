import { Abstraction } from "@webiny/di";

export interface IRequestId {
    value: string;
}

/**
 * Identifier for the current request.
 *
 * Every request container gets a generated value. Transports that have a meaningful id of their
 * own (AWS Lambda, for instance) override it with theirs, so a value reported to a client can be
 * matched against the platform's own logs.
 */
export const RequestId = new Abstraction<IRequestId>("RequestId");

export namespace RequestId {
    export type Interface = IRequestId;
}
