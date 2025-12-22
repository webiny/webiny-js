import { createImplementation } from "@webiny/di";
import { SqsEventQualifier } from "../../abstractions/qualifiers/SqsEventQualifier.js";

export class SqsEventQualifierImpl implements SqsEventQualifier.Interface {
    execute(event: any): boolean {
        return Array.isArray(event.Records) && event.Records[0]?.eventSource === "aws:sqs";
    }
}

export const sqsEventQualifier = createImplementation({
    abstraction: SqsEventQualifier,
    implementation: SqsEventQualifierImpl,
    dependencies: []
});

