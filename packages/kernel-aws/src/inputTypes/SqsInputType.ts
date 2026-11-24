import type { SQSEvent } from "@webiny/aws-sdk/types/index.js";
import { InputType } from "@webiny/kernel-core";
import { SqsInputHandler } from "../abstractions/handlers/SqsInputHandler.js";
import type { IInputType } from "@webiny/kernel-core";

class SqsInputTypeImpl implements IInputType<SQSEvent> {
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
