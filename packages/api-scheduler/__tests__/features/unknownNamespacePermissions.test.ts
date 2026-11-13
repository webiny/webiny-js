import { beforeEach, describe, expect, it } from "vitest";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { useHandler } from "~tests/__mocks/handler/useHandler.js";
import { createMockScheduleClient } from "~tests/__mocks/scheduleClient.js";
import { SchedulerService } from "~/shared/abstractions.js";
import { VoidSchedulerService } from "~/features/SchedulerService/VoidSchedulerService.js";
import { GetScheduledActionUseCase } from "~/features/GetScheduledAction/index.js";
import { GetTargetScheduledActionUseCase } from "~/features/GetTargetScheduledAction/index.js";
import { ListScheduledActionsUseCase } from "~/features/ListScheduledActions/index.js";
import { CancelScheduledActionUseCase } from "~/features/CancelScheduledAction/index.js";
import { NamespaceHandler } from "~tests/__mocks/NamespaceHandler.js";
import { PublishTestEntryActionHandler } from "~tests/__mocks/PublishTestEntryActionHandler.js";

/**
 * No `SchedulerPermissions` implementation is registered here, so no namespace has permissions.
 * The identity has full access - a namespace without permissions is still denied.
 */
describe("namespace without permissions", () => {
    let context: CmsContext;

    const namespace = PublishTestEntryActionHandler.name;

    beforeEach(async () => {
        const contextHandler = useHandler({
            getScheduleClient: () => {
                return createMockScheduleClient();
            }
        });
        context = await contextHandler.handler();
        context.container.register(NamespaceHandler);
        context.container.register(PublishTestEntryActionHandler);
        context.container.registerInstance(SchedulerService, new VoidSchedulerService());
    });

    it("should not get a scheduled action", async () => {
        const result = await context.container.resolve(GetScheduledActionUseCase).execute({
            id: "non-existing-id",
            namespace
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Scheduler/NotAuthorized");
    });

    it("should not get a target scheduled action", async () => {
        const result = await context.container.resolve(GetTargetScheduledActionUseCase).execute({
            id: "non-existing-id",
            namespace
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Scheduler/NotAuthorized");
    });

    it("should not list scheduled actions", async () => {
        const result = await context.container.resolve(ListScheduledActionsUseCase).execute({
            where: { namespace }
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Scheduler/NotAuthorized");
    });

    it("should not cancel a scheduled action", async () => {
        const result = await context.container.resolve(CancelScheduledActionUseCase).execute({
            id: "non-existing-id",
            namespace
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Scheduler/NotAuthorized");
    });
});
