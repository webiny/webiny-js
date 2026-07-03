import { beforeEach, describe, expect, it } from "vitest";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { useHandler } from "~tests/__mocks/handler/useHandler.js";
import { createMockScheduleClient } from "~tests/__mocks/scheduleClient.js";
import { SchedulerService } from "@webiny/api-scheduler/shared/abstractions.js";
import { VoidSchedulerService } from "@webiny/api-scheduler/features/SchedulerService/VoidSchedulerService.js";
import { GetScheduledActionUseCase } from "@webiny/api-scheduler/features/GetScheduledAction/index.js";
import { NamespaceHandler } from "~tests/__mocks/NamespaceHandler.js";
import { PublishTestEntryActionHandler } from "~tests/__mocks/PublishTestEntryActionHandler.js";

describe("GetScheduledActionUseCase", () => {
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

    it("should resolve from container", async () => {
        const resolved = context.container.resolve(GetScheduledActionUseCase);
        //
        expect(resolved.execute).toBeFunction();
    });

    it("should fail to get a non-existing scheduled action", async () => {
        const getScheduledActionUseCase = context.container.resolve(GetScheduledActionUseCase);

        const result = await getScheduledActionUseCase.execute({
            id: "non-existing-id",
            namespace
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Scheduler/ScheduledAction/NotFound");
    });
});
