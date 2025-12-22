import { createImplementation } from "@webiny/di";
import { S3EventQualifier } from "~/abstractions/S3EventQualifier.js";

export class S3EventQualifierImpl implements S3EventQualifier.Interface {
    execute(event: any): boolean {
        return Array.isArray(event.Records) && event.Records[0]?.eventSource === "aws:s3";
    }
}

export const s3EventQualifier = createImplementation({
    abstraction: S3EventQualifier,
    implementation: S3EventQualifierImpl,
    dependencies: []
});

