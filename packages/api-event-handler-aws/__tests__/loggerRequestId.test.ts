/**
 * Every line the API logs on AWS must carry the id of the invocation that wrote it, so CloudWatch
 * lines can be grouped by request. The logger is built once, in the ROOT container, by
 * `registerWebinyApiRoot`; these tests log through it from inside an invocation and read the line it
 * writes to stdout.
 */
import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import type { Context } from "@webiny/aws-sdk/types/index.js";
import { createLambdaHandler } from "@webiny/event-handler-aws";
import { EventHandler } from "@webiny/event-handler-core";
import { EventType } from "@webiny/event-handler-core";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { registerWebinyApiRoot } from "~/composition/registerWebinyApiRoot.js";

class AnyEventType implements EventType.Interface {
    canHandle(_event: any): _event is any {
        return true;
    }
    getHandlerAbstraction() {
        return EventHandler;
    }
}

const anyEventType = EventType.createImplementation({
    implementation: AnyEventType,
    dependencies: []
});

class LogHandler implements EventHandler.Interface {
    constructor(private logger: Logger.Interface) {}

    async execute() {
        this.logger.info("Handled the event.");
    }
}

const logHandler = EventHandler.createImplementation({
    implementation: LogHandler,
    dependencies: [Logger]
});

const createHandler = () => {
    return createLambdaHandler({
        root: async container => {
            container.register(anyEventType);
            container.register(logHandler);
            await registerWebinyApiRoot(container, {
                extensions: () => [],
                registerRootStorage: () => {}
            });
        }
    });
};

describe("API log lines on AWS", () => {
    let lines: any[];

    beforeEach(() => {
        lines = [];
        vi.spyOn(process.stdout, "write").mockImplementation((chunk: any) => {
            const line = String(chunk);
            const parsed = JSON.parse(line);
            lines.push(parsed);
            return true;
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should carry the invocation's request id", async () => {
        const handler = createHandler();

        await handler({}, { awsRequestId: "first-request" } as Context);
        await handler({}, { awsRequestId: "second-request" } as Context);

        const requestIds = lines.map(line => line.requestId);
        expect(requestIds).toEqual(["first-request", "second-request"]);
        expect(lines[0].message.msg).toBe("Handled the event.");
    });
});
