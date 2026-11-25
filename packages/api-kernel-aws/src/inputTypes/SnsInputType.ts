import type { SNSEvent } from "@webiny/aws-sdk/types/index.js";
import { InputType } from "@webiny/api-kernel-core";
import { SnsInputHandler } from "../abstractions/handlers/SnsInputHandler.js";

class SnsInputTypeImpl implements InputType.Interface<SNSEvent> {
    matches(input: any): input is SNSEvent {
        return !!(input?.Records && input.Records[0]?.EventSource === "aws:sns");
    }

    getHandlerAbstraction() {
        return SnsInputHandler;
    }
}

export const SnsInputType = InputType.createImplementation({
    implementation: SnsInputTypeImpl,
    dependencies: []
});
