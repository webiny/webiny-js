import { createAbstraction } from "../createAbstraction.js";

/**
 * Abstraction for DynamoDB Stream event qualifier
 */
export interface IDynamoDBEventQualifier {
    execute(event: any): boolean;
}

export const DynamoDBEventQualifier = createAbstraction<IDynamoDBEventQualifier>("DynamoDBEventQualifier");

export namespace DynamoDBEventQualifier {
    export type Interface = IDynamoDBEventQualifier;
}

