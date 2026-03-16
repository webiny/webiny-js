import { beforeEach, describe, expect, it } from "vitest";
import { RawEventHandler } from "@webiny/handler-aws/raw/index.js";
import {
    createScheduledActionEventHandler,
    type IScheduledActionEvent
} from "~/createEventHandler.js";
import { registry } from "@webiny/handler-aws/registry.js";
import type { LambdaContext } from "@webiny/handler-aws/types.js";
import { SCHEDULED_ACTION_EVENT_IDENTIFIER } from "~/constants.js";
import { ScheduledActionId } from "~/domain/ScheduledActionId.js";
import { useHandler } from "./__mocks/handler/useHandler.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { createMockScheduleClient } from "./__mocks/scheduleClient.js";
import { SchedulerService } from "~/shared/abstractions.js";
import { VoidSchedulerService } from "~/features/SchedulerService/VoidSchedulerService.js";
import { ScheduleActionUseCase } from "~/features/ScheduleAction/index.js";
import {
    PublishTestEntryActionHandler,
    PublishTestEntryActionHandlerImpl
} from "~tests/__mocks/PublishTestEntryActionHandler.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { NamespaceHandler } from "~tests/__mocks/NamespaceHandler.js";

describe("Scheduler Event Handler", () => {
    const lambdaContext = {} as LambdaContext;

    const namespace = PublishTestEntryActionHandlerImpl.name;

    let context: CmsContext;

    beforeEach(async () => {
        const contextHandler = useHandler({
            getScheduleClient: () => {
                return createMockScheduleClient();
            }
        });
        context = await contextHandler.handler();
        context.container.register(PublishTestEntryActionHandler);
        context.container.register(NamespaceHandler);
        context.container.registerInstance(SchedulerService, new VoidSchedulerService());
    });

    it("should trigger handle an event which matches scheduled event", async () => {
        const eventHandler = createScheduledActionEventHandler();

        expect(eventHandler).toBeInstanceOf(RawEventHandler);

        const event: IScheduledActionEvent = {
            [SCHEDULED_ACTION_EVENT_IDENTIFIER]: {
                id: ScheduledActionId.from({
                    namespace,
                    actionType: "publish",
                    targetId: "target-id#0001"
                }),
                namespace,
                scheduleFor: new Date().toISOString()
            }
        };
        const sourceHandler = registry.getHandler(event, lambdaContext);

        expect(sourceHandler).toMatchObject({
            name: "handler-aws-event-bridge-scheduled-cms-action-event"
        });
        expect(sourceHandler.canUse(event, lambdaContext)).toBe(true);
    });

    it("should run handle action", async () => {
        const eventHandler = createScheduledActionEventHandler();
        const scheduleActionUseCase = context.container.resolve(ScheduleActionUseCase);

        const scheduleFor = new Date(new Date().getTime() + 5 * 60 * 1000);
        const createResult = await scheduleActionUseCase.execute({
            namespace: PublishTestEntryActionHandlerImpl.name,
            actionType: "publish",
            targetId: "target-id#0001",
            scheduleFor,
            immediately: false
        });

        expect(createResult.isOk()).toBeTrue();
        expect(createResult.value).toEqual({
            actionType: "publish",
            id: expect.stringMatching("wby-schedule-"),
            namespace: PublishTestEntryActionHandlerImpl.name,
            payload: {
                actionType: "publish",
                namespace: "Test/SomeCustomEntry",
                scheduleId: expect.stringMatching("wby-schedule-"),
                targetId: "target-id#0001",
                title: "Fetched title from handler",
                something: true
            },
            scheduledBy: {
                displayName: "John Doe",
                id: "id-12345678",
                type: "admin"
            },
            scheduledFor: scheduleFor,
            targetId: "target-id#0001",
            title: "Fetched title from handler"
        });
        /**
         * Use anonymous identity to start the event handler - this way we make sure that the action handler
         * uses the identity stored on the scheduled action itself.
         */
        const identityContext = context.container.resolve(IdentityContext);
        identityContext.setIdentity(undefined);

        const id = createResult.value.id;

        const result = await eventHandler.cb({
            payload: {
                [SCHEDULED_ACTION_EVENT_IDENTIFIER]: {
                    id,
                    namespace,
                    scheduleFor: new Date(new Date().getTime() + 3 * 60 * 1000).toISOString()
                }
            },
            context,
            request: context.request,
            reply: context.reply
        });
        expect(result).toEqual({
            success: true
        });
    });
});
