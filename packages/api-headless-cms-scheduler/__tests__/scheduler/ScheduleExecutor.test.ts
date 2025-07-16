import { ScheduleExecutor } from "~/scheduler/ScheduleExecutor.js";
import { createMockService } from "~tests/mocks/service.js";
import { createMockScheduleModel } from "~tests/mocks/scheduleModel.js";
import { createMockCms } from "~tests/mocks/cms.js";
import { createMockFetcher } from "~tests/mocks/fetcher.js";

describe("ScheduleExecutor", () => {
    const service = createMockService();
    const scheduleModel = createMockScheduleModel();
    const cms = createMockCms();
    const fetcher = createMockFetcher();

    it("should execute not find action for publishing", async () => {
        const executor = new ScheduleExecutor({
            actions: [],
            scheduleModel,
            cms,
            service,
            fetcher
        });

        await expect(
            executor.schedule("target-id#0001", {
                type: "publish",
                dateOn: new Date()
            })
        ).rejects.toThrow(`No action found for input type "publish"`);
    });

    it("should execute not find action for unpublishing", async () => {
        const executor = new ScheduleExecutor({
            actions: [],
            scheduleModel,
            cms,
            service,
            fetcher
        });

        await expect(
            executor.schedule("target-id#0001", {
                type: "unpublish",
                dateOn: new Date()
            })
        ).rejects.toThrow(`No action found for input type "unpublish"`);
    });
});
