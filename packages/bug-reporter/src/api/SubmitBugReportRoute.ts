import { HttpRouteDefinition } from "@webiny/event-handler-core";
import { HttpRouteHandler } from "@webiny/event-handler-core";
import { toSseFrame } from "@webiny/event-handler-core";
import type { IHttpRequest } from "@webiny/event-handler-core";
import type { IHttpResponseBuilder } from "@webiny/event-handler-core";
import { SubmitBugReportUseCase } from "./submitBugReport/abstractions.js";
import { readPayload } from "./readPayload.js";
import type { BugReportStreamEvent } from "../shared/types.js";

const STATUS_BY_CODE: Record<string, number> = {
    BUG_REPORT_NOT_AUTHORIZED: 401,
    BUG_REPORT_EMPTY: 400
};

async function* toSseFrames(events: AsyncGenerator<BugReportStreamEvent>): AsyncGenerator<string> {
    for await (const event of events) {
        yield toSseFrame(event);
    }
}

/*
 * Transport for the bug reporter. Parses the body, calls one use case, and maps the outcome onto a
 * status code or an event stream.
 *
 * Streamed rather than answered in one shot because the work is slow and someone is watching: a
 * model call, then an upload per screenshot, then the issue itself. A background task would be
 * wrong twice over — there is somebody to stream to, and the payload carries base64 screenshots,
 * routinely megabytes, which cannot go into a task's persisted `input` under DynamoDB's 400 kB cap.
 *
 * Everything the use case can decide up front comes back as a failed Result, so authorization and
 * an empty report get real status codes. Once the first frame is out the status is committed to
 * 200 and failures can only be an `error` event.
 */
class SubmitBugReportRouteImpl implements HttpRouteHandler.Interface {
    constructor(private submitBugReport: SubmitBugReportUseCase.Interface) {}

    async handle(
        request: IHttpRequest,
        response: IHttpResponseBuilder
    ): Promise<IHttpResponseBuilder> {
        const payload = readPayload(request.body);

        if (!payload) {
            return response.status(400).json({ message: "The report payload is malformed." });
        }

        const result = await this.submitBugReport.execute(payload);

        if (result.isFail()) {
            const error = result.error;
            const status = STATUS_BY_CODE[error.code] ?? 500;
            return response.status(status).json({ message: error.message, code: error.code });
        }

        return response.sse(toSseFrames(result.value));
    }
}

export const SubmitBugReportRoute = HttpRouteHandler.createImplementation({
    implementation: SubmitBugReportRouteImpl,
    dependencies: [SubmitBugReportUseCase]
});

class SubmitBugReportRouteDefinitionImpl implements HttpRouteDefinition.Interface {
    readonly name = "bug-report-stream";
    readonly method = "POST";
    readonly path = "/stream/bug-report";
    readonly handler = SubmitBugReportRoute;
}

/* What the router matches on. Zero dependencies, so building it costs nothing. */
export const SubmitBugReportRouteDefinition = HttpRouteDefinition.createImplementation({
    implementation: SubmitBugReportRouteDefinitionImpl,
    dependencies: []
});
