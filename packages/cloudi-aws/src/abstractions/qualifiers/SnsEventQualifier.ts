import { createAbstraction } from "../createAbstraction.js";

/**
 * Abstraction for SNS event qualifier
 * Determines if an event is an SNS event
 */
export interface ISnsEventQualifier {
    /**
     * Check if the event is an SNS event
     */
    execute(event: any): boolean;
}

export const SnsEventQualifier = createAbstraction<ISnsEventQualifier>("SnsEventQualifier");

export namespace SnsEventQualifier {
    export type Interface = ISnsEventQualifier;
}

