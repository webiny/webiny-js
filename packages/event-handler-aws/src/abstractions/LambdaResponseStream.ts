import { Abstraction } from "@webiny/di";
import type { IRawResponseStream } from "~/streaming/awslambda.js";

export interface ILambdaResponseStream {
    get(): IRawResponseStream;
}

/**
 * The per-invocation response stream handed over by the Lambda runtime, bound into the request
 * container by {@link awsLambdaStreamTransport} so the terminal handler can write to it.
 */
export const LambdaResponseStream = new Abstraction<ILambdaResponseStream>("LambdaResponseStream");

export namespace LambdaResponseStream {
    export type Interface = ILambdaResponseStream;
}

export class LambdaResponseStreamValue implements ILambdaResponseStream {
    constructor(private stream: IRawResponseStream) {}

    get(): IRawResponseStream {
        return this.stream;
    }
}
