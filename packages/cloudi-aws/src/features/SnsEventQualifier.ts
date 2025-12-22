import { createImplementation } from "@webiny/di";
import { SnsEventQualifier } from "~/abstractions/SnsEventQualifier.js";

export class SnsEventQualifierImpl implements SnsEventQualifier.Interface {
    execute(event: any): boolean {
        return Array.isArray(event.Records) && event.Records[0]?.EventSource === "aws:sns";
    }
}

export const snsEventQualifier = createImplementation({
    abstraction: SnsEventQualifier,
    implementation: SnsEventQualifierImpl,
    dependencies: []
});

