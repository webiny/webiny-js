import type { SNSEvent } from "@webiny/aws-sdk/types/index.js";
import { InputType } from "@webiny/kernel-core";
import { SnsInputHandler } from "../abstractions/handlers/SnsInputHandler.js";
import type { IInputType } from "@webiny/kernel-core";

class SnsInputTypeImpl implements IInputType<SNSEvent> {
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
