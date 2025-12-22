import { createAbstraction } from "./createAbstraction.js";

/**
 * Abstraction for SQS event qualifier
 */
export interface ISqsEventQualifier {
    execute(event: any): boolean;
}

export const SqsEventQualifier = createAbstraction<ISqsEventQualifier>("SqsEventQualifier");

export namespace SqsEventQualifier {
    export type Interface = ISqsEventQualifier;
}

