import { ApiStreamClient } from "@webiny/app/features/apiStreamClient/index.js";
import { readServerSentEvents } from "@webiny/app/features/apiStreamClient/index.js";
import { SubmitBugReportGateway as Abstraction } from "./abstractions.js";
import type { BugReportStreamEvent } from "../../shared/types.js";
import type { IBugReportPayload } from "../../shared/types.js";

class SubmitBugReportGatewayImpl implements Abstraction.Interface {
    constructor(private client: ApiStreamClient.Interface) {}

    async *execute(
        payload: IBugReportPayload,
        signal?: AbortSignal
    ): AsyncGenerator<BugReportStreamEvent> {
        const response = await this.client.execute({
            path: "/stream/bug-report",
            body: payload,
            signal
        });

        yield* readServerSentEvents<BugReportStreamEvent>(response);
    }
}

export const SubmitBugReportGateway = Abstraction.createImplementation({
    implementation: SubmitBugReportGatewayImpl,
    dependencies: [ApiStreamClient]
});
