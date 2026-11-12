import { describe, expect, it } from "vitest";
import { createHandler } from "@webiny/handler-aws";
import type { LambdaContext } from "@webiny/handler-aws/types.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import {
    SCHEDULED_ACTION_EVENT_IDENTIFIER,
    SCHEDULED_ACTION_PUBLISH
} from "@webiny/api-scheduler/constants.js";
import { ScheduledActionHandler } from "@webiny/api-scheduler/shared/abstractions.js";
import { ScheduleActionUseCase } from "@webiny/api-scheduler/features/ScheduleAction/index.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { createHandlerCore } from "./__mocks/handler/plugins.js";
import { useHandler } from "./__mocks/handler/useHandler.js";
import { createMockScheduleClient } from "./__mocks/scheduleClient.js";
import { NamespaceHandler } from "./__mocks/NamespaceHandler.js";
import { PublishTestEntryActionHandlerImpl } from "./__mocks/PublishTestEntryActionHandler.js";

const handled: string[] = [];

class RecordingActionHandler extends PublishTestEntryActionHandlerImpl {
    public override async handle(action?: { id: string }): Promise<void> {
        handled.push(action!.id);
    }
}

const RecordingHandler = ScheduledActionHandler.createImplementation({
    implementation: RecordingActionHandler,
    dependencies: []
});

const registerTestHandlers = () =>
    createRegisterExtensionPlugin(async context => {
        context.container.register(RecordingHandler);
        context.container.register(NamespaceHandler);
    });

describe("scheduled action event through the Lambda entry point", () => {
    it("executes the scheduled action when EventBridge invokes the Lambda", async () => {
        const getScheduleClient = () => createMockScheduleClient();

        // Schedule the action the way the GraphQL API does.
        const api = useHandler({ getScheduleClient, plugins: [registerTestHandlers()] });
        const context = (await api.handler()) as CmsContext;
        const scheduled = await context.container.resolve(ScheduleActionUseCase).execute({
            namespace: PublishTestEntryActionHandlerImpl.name,
            actionType: SCHEDULED_ACTION_PUBLISH,
            targetId: "target-id#0001",
            scheduleFor: new Date(Date.now() + 5 * 60 * 1000),
            immediately: false,
            tenant: "root"
        });
        expect(scheduled.isOk()).toBe(true);

        // Invoke the Lambda entry point with the payload EventBridgeSchedulerService puts on the schedule.
        const core = createHandlerCore({ getScheduleClient, plugins: [registerTestHandlers()] });
        const lambda = createHandler({ plugins: core.plugins });
        const event = {
            [SCHEDULED_ACTION_EVENT_IDENTIFIER]: {
                id: scheduled.value.id,
                tenant: "root",
                namespace: PublishTestEntryActionHandlerImpl.name,
                scheduleFor: scheduled.value.scheduledFor.toISOString()
            }
        };

        const result = await lambda(event, {} as LambdaContext);

        expect(result).toEqual({ success: true });
        expect(handled).toEqual([scheduled.value.id]);
    });
});
