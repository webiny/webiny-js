import { ScheduleExecutor } from "~/scheduler/ScheduleExecutor.js";
import { createMockService } from "~tests/mocks/service.js";
import { createMockScheduleModel } from "~tests/mocks/scheduleModel.js";
import { createMockCms } from "~tests/mocks/cms.js";
import { createMockFetcher } from "~tests/mocks/fetcher.js";
import { type IScheduleRecord, ScheduleType } from "~/scheduler/types.js";
import { createScheduleRecord } from "~/scheduler/ScheduleRecord.js";
import { createMockGetIdentity } from "~tests/mocks/getIdentity.js";

describe("ScheduleExecutor", () => {
    const service = createMockService();
    const scheduleModel = createMockScheduleModel();
    const cms = createMockCms();

    it("should execute not find action for publishing", async () => {
        const fetcher = createMockFetcher({
            async getScheduled(targetId: string): Promise<IScheduleRecord> {
                return createScheduleRecord({
                    id: `schedule-record-id-${targetId}`,
                    targetId,
                    scheduledOn: new Date(),
                    dateOn: new Date(),
                    type: ScheduleType.publish,
                    title: `Scheduled for ${targetId}`,
                    scheduledBy: createMockGetIdentity()(),
                    model: {} as any
                });
            }
        });
        const executor = new ScheduleExecutor({
            actions: [],
            scheduleModel,
            cms,
            service,
            fetcher
        });

        await expect(
            executor.schedule("target-id#0001", {
                type: ScheduleType.publish,
                scheduleOn: new Date()
            })
        ).rejects.toThrow(`No action found for input type "${ScheduleType.publish}"`);

        await expect(executor.cancel("target-id#0001")).rejects.toThrow(
            `No action found for input type "${ScheduleType.publish}"`
        );
    });

    it("should execute not find action for unpublishing", async () => {
        const fetcher = createMockFetcher({
            async getScheduled(targetId: string): Promise<IScheduleRecord> {
                return createScheduleRecord({
                    id: `schedule-record-id-${targetId}`,
                    targetId,
                    scheduledOn: new Date(),
                    dateOn: new Date(),
                    type: ScheduleType.unpublish,
                    title: `Scheduled for ${targetId}`,
                    scheduledBy: createMockGetIdentity()(),
                    model: {} as any
                });
            }
        });
        const executor = new ScheduleExecutor({
            actions: [],
            scheduleModel,
            cms,
            service,
            fetcher
        });

        await expect(
            executor.schedule("target-id#0001", {
                type: ScheduleType.unpublish,
                scheduleOn: new Date()
            })
        ).rejects.toThrow(`No action found for input type "${ScheduleType.unpublish}"`);

        await expect(executor.cancel("target-id#0001")).rejects.toThrow(
            `No action found for input type "${ScheduleType.unpublish}"`
        );
    });
});
