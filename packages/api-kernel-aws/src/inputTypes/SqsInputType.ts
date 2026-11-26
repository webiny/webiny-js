import type { SQSEvent } from "@webiny/aws-sdk/types/index.js";
import { InputType } from "@webiny/api-kernel-core";
import { SqsInputHandler } from "../abstractions/handlers/SqsInputHandler.js";

class SqsInputTypeImpl implements InputType.Interface<SQSEvent> {
    matches(input: any): input is SQSEvent {
        return !!(input?.Records && input.Records[0]?.eventSource === "aws:sqs");
    }

    getHandlerAbstraction() {
        return SqsInputHandler;
    }
}

export const SqsInputType = InputType.createImplementation({
    implementation: SqsInputTypeImpl,
    dependencies: []
});
