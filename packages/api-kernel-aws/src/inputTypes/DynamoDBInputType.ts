import type { DynamoDBStreamEvent } from "@webiny/aws-sdk/types/index.js";
import { InputType } from "@webiny/api-kernel-core";
import { DynamoDBInputHandler } from "../abstractions/handlers/DynamoDBInputHandler.js";

class DynamoDBInputTypeImpl implements InputType.Interface<DynamoDBStreamEvent> {
    matches(input: any): input is DynamoDBStreamEvent {
        return !!(input?.Records && input.Records[0]?.eventSource === "aws:dynamodb");
    }

    getHandlerAbstraction() {
        return DynamoDBInputHandler;
    }
}

export const DynamoDBInputType = InputType.createImplementation({
    implementation: DynamoDBInputTypeImpl,
    dependencies: []
});
