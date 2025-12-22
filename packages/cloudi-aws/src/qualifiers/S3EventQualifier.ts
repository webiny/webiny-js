import { createAbstraction } from "../abstractions/createAbstraction.js";

/**
 * Abstraction for S3 event qualifier
 */
export interface IS3EventQualifier {
    execute(event: any): boolean;
}

export const S3EventQualifier = createAbstraction<IS3EventQualifier>("S3EventQualifier");

export namespace S3EventQualifier {
    export type Interface = IS3EventQualifier;
}

