import { describe, expect, it } from "vitest";
import { RawEventHandler } from "@webiny/handler-aws/raw/index.js";
import {
    createScheduledActionEventHandler,
    type IScheduledActionEvent
} from "~/createEventHandler.js";
import { registry } from "@webiny/handler-aws/registry.js";
import type { LambdaContext } from "@webiny/handler-aws/types.js";
import { SCHEDULED_CMS_ACTION_EVENT_IDENTIFIER } from "~/constants.js";
import { ScheduledActionId } from "~/domain/ScheduledActionId.js";

describe("Scheduler Event Handler", () => {
    const lambdaContext = {} as LambdaContext;
    it("should trigger handle an event which matches scheduled event", async () => {
        const eventHandler = createScheduledActionEventHandler();

        expect(eventHandler).toBeInstanceOf(RawEventHandler);

        const event: IScheduledActionEvent = {
            [SCHEDULED_CMS_ACTION_EVENT_IDENTIFIER]: {
                id: ScheduledActionId.from({
                    namespace: "Cms/Entry/Article",
                    actionType: "Publish",
                    targetId: "target-id#0001"
                }),
                scheduleOn: new Date().toISOString()
            }
        };
        const sourceHandler = registry.getHandler(event, lambdaContext);

        expect(sourceHandler).toMatchObject({
            name: "handler-aws-event-bridge-scheduled-cms-action-event"
        });
        expect(sourceHandler.canUse(event, lambdaContext)).toBe(true);
    });
});
