import type { S3Event } from "@webiny/aws-sdk/types/index.js";
import { InputType } from "@webiny/api-kernel-core";
import { S3InputHandler } from "../abstractions/handlers/S3InputHandler.js";

class S3InputTypeImpl implements InputType.Interface<S3Event> {
    matches(input: any): input is S3Event {
        return !!(input?.Records && input.Records[0]?.eventSource === "aws:s3");
    }

    getHandlerAbstraction() {
        return S3InputHandler;
    }
}

export const S3InputType = InputType.createImplementation({
    implementation: S3InputTypeImpl,
    dependencies: []
});
