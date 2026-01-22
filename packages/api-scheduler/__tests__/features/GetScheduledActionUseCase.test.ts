import { beforeEach, describe, expect, it } from "vitest";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { useHandler } from "~tests/__mocks/context/useHandler.js";
import { createMockScheduleClient } from "~tests/__mocks/scheduleClient.js";
import { SchedulerService } from "~/shared/abstractions.js";
import { VoidSchedulerService } from "~/features/SchedulerService/VoidSchedulerService.js";
import { GetScheduledActionUseCase } from "~/features/GetScheduledAction/index.js";

describe("GetScheduledActionUseCase", () => {
    let context: CmsContext;

    beforeEach(async () => {
        const contextHandler = useHandler({
            getScheduleClient: () => {
                return createMockScheduleClient();
            }
        });
        context = await contextHandler.handler();
        context.container.registerInstance(SchedulerService, new VoidSchedulerService());
    });

    it("should resolve from container", async () => {
        const resolved = context.container.resolve(GetScheduledActionUseCase);
        //
        expect(resolved.execute).toBeFunction();
    });

    it("should fail to get a non-existing scheduled action", async () => {
        const getScheduledActionUseCase = context.container.resolve(GetScheduledActionUseCase);

        const result = await getScheduledActionUseCase.execute("non-existing-id");

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Scheduler/ScheduledAction/NotFound");
    });
});
