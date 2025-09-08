import { createScheduler } from "~/scheduler/createScheduler.js";
import { createMockService } from "~tests/mocks/service.js";
import { createMockSchedulerModel } from "~tests/mocks/schedulerModel.js";
import { createMockTargetModel } from "~tests/mocks/targetModel.js";
import { createMockCms } from "~tests/mocks/cms.js";
import { createMockSecurity } from "~tests/mocks/security.js";
import { Scheduler } from "~/scheduler/Scheduler.js";

describe("createScheduler", () => {
    const service = createMockService();
    const scheduleModel = createMockSchedulerModel();
    const targetModel = createMockTargetModel();
    const cms = createMockCms();
    const security = createMockSecurity();

    it("should create a scheduler", async () => {
        const result = await createScheduler({
            service,
            cms,
            security,
            scheduleModel
        });
        expect(result).toBeInstanceOf(Function);

        const scheduler = result(targetModel);
        expect(scheduler).toHaveProperty("fetcher");
        expect(scheduler).toHaveProperty("executor");
        expect(scheduler).toBeInstanceOf(Scheduler);
    });
});
