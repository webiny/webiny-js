import { beforeEach, describe, expect, it } from "vitest";
import { createHandler } from "@webiny/handler-aws";
import type { LambdaContext } from "@webiny/handler-aws/types.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { SCHEDULED_ACTION_EVENT_IDENTIFIER } from "@webiny/api-scheduler/constants.js";
import { SCHEDULED_ACTION_PUBLISH } from "@webiny/api-scheduler/constants.js";
import { ScheduledActionHandler } from "@webiny/api-scheduler/shared/abstractions.js";
import type { IScheduledAction } from "@webiny/api-scheduler/shared/abstractions.js";
import type { ScheduledActionType } from "@webiny/api-scheduler/shared/abstractions.js";
import { ScheduleActionUseCase } from "@webiny/api-scheduler/features/ScheduleAction/index.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { createHandlerCore } from "./__mocks/handler/plugins.js";
import { useHandler } from "./__mocks/handler/useHandler.js";
import { createMockScheduleClient } from "./__mocks/scheduleClient.js";
import { NamespaceHandler } from "./__mocks/NamespaceHandler.js";
import { PublishTestEntryActionHandlerImpl } from "./__mocks/PublishTestEntryActionHandler.js";

const handled: string[] = [];

class RecordingActionHandler implements ScheduledActionHandler.Interface {
    public canHandle(namespace: string, actionType: ScheduledActionType): boolean {
        return (
            namespace === PublishTestEntryActionHandlerImpl.name &&
            actionType === SCHEDULED_ACTION_PUBLISH
        );
    }

    public async handle(action: IScheduledAction): Promise<void> {
        handled.push(action.id);
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
    beforeEach(() => {
        handled.length = 0;
    });

    it("executes the scheduled action when EventBridge invokes the Lambda", async () => {
        const getScheduleClient = () => createMockScheduleClient();
        const apiTestHandlers = registerTestHandlers();
        const lambdaTestHandlers = registerTestHandlers();
        const scheduleFor = new Date(Date.now() + 5 * 60 * 1000);

        // Schedule the action the way the GraphQL API does.
        const api = useHandler({ getScheduleClient, plugins: [apiTestHandlers] });
        const context: CmsContext = await api.handler();
        const scheduleAction = context.container.resolve(ScheduleActionUseCase);
        const scheduled = await scheduleAction.execute({
            namespace: PublishTestEntryActionHandlerImpl.name,
            actionType: SCHEDULED_ACTION_PUBLISH,
            targetId: "target-id#0001",
            scheduleFor,
            immediately: false,
            tenant: "root"
        });
        expect(scheduled.isOk()).toBe(true);

        // Invoke the Lambda entry point with the payload EventBridgeSchedulerService puts on the schedule.
        const core = createHandlerCore({ getScheduleClient, plugins: [lambdaTestHandlers] });
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
