import { describe, expect, it } from "vitest";
import { RawEventHandler } from "@webiny/handler-aws/raw/index.js";
import { createScheduledCmsActionEventHandler } from "~/handler/index.js";
import { registry } from "@webiny/handler-aws/registry.js";
import type { LambdaContext } from "@webiny/handler-aws/types.js";
import { SCHEDULED_CMS_ACTION_EVENT_IDENTIFIER } from "~/constants.js";
import type { IWebinyScheduledCmsActionEvent } from "~/handler/Handler.js";
import { createScheduleRecordId } from "~/scheduler/createScheduleRecordId.js";

describe("Scheduler Event Handler", () => {
    const lambdaContext = {} as LambdaContext;
    it("should trigger handle an event which matches scheduled event", async () => {
        const eventHandler = createScheduledCmsActionEventHandler();

        expect(eventHandler).toBeInstanceOf(RawEventHandler);

        const event: IWebinyScheduledCmsActionEvent = {
            [SCHEDULED_CMS_ACTION_EVENT_IDENTIFIER]: {
                id: createScheduleRecordId("target-id#0001"),
                scheduleOn: new Date().toISOString()
            }
        };
        const sourceHandler = registry.getHandler(event, lambdaContext);

        expect(sourceHandler).toMatchObject({
            name: "handler-aws-event-bridge-scheduled-cms-action-event"
        });
        expect(sourceHandler.canUse(event, lambdaContext)).toBe(true);

        /**
         * Should break because there are no contexts loaded.
         */
        const result = await sourceHandler.handle({
            params: {
                plugins: [eventHandler]
            },
            event,
            context: lambdaContext
        });
        /**
         * We are expecting an error because the context is not set up properly - we dont need it to be set up.
         */
        expect(result).toEqual({
            body: '{"message":"Cannot read properties of undefined (reading \'withoutAuthorization\')"}',
            headers: {
                "access-control-allow-headers": "*",
                "access-control-allow-methods": "POST",
                "access-control-allow-origin": "*",
                "cache-control": "no-store",
                connection: "keep-alive",
                "content-length": "82",
                "content-type": "text/plain; charset=utf-8",
                date: expect.toBeDateString()
            },
            isBase64Encoded: false,
            statusCode: 500
        });
    });
});
