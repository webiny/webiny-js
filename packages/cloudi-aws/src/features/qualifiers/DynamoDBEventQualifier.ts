import { createImplementation } from "@webiny/di";
import { DynamoDBEventQualifier } from "../../abstractions/qualifiers/DynamoDBEventQualifier.js";

export class DynamoDBEventQualifierImpl implements DynamoDBEventQualifier.Interface {
    execute(event: any): boolean {
        return Array.isArray(event.Records) && event.Records[0]?.eventSource === "aws:dynamodb";
    }
}

export const dynamoDBEventQualifier = createImplementation({
    abstraction: DynamoDBEventQualifier,
    implementation: DynamoDBEventQualifierImpl,
    dependencies: []
});
