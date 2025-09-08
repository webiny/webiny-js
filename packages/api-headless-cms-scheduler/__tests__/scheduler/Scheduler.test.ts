import { Scheduler } from "~/scheduler/Scheduler.js";
import { type ISchedulerInput, ScheduleType } from "~/scheduler/types.js";

describe("Scheduler", () => {
    const fetcher = {
        getScheduled: jest.fn(),
        listScheduled: jest.fn()
    };
    const executor = {
        schedule: jest.fn(),
        cancel: jest.fn()
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should create an instance of Scheduler", () => {
        const result = new Scheduler({ fetcher, executor });

        expect(result).toBeInstanceOf(Scheduler);
    });

    it("should call fetcher.getScheduled when fetching a schedule", async () => {
        const scheduler = new Scheduler({ fetcher, executor });
        const targetId = "target-id#0001";
        const expectedResult = { id: "schedule-id#0001", targetId, dateOn: new Date() };
        fetcher.getScheduled.mockResolvedValue(expectedResult);
        const result = await scheduler.getScheduled(targetId);
        expect(fetcher.getScheduled).toHaveBeenCalledWith(targetId);
        expect(result).toEqual(expectedResult);
    });

    it("should call fetcher.listScheduled when listing schedules", async () => {
        const scheduler = new Scheduler({ fetcher, executor });
        const expectedResult = [
            { id: "schedule-id#0001", targetId: "target-id#0001", dateOn: new Date() }
        ];
        fetcher.listScheduled.mockResolvedValue(expectedResult);
        const result = await scheduler.listScheduled({
            sort: undefined,
            after: undefined,
            limit: undefined,
            where: {}
        });
        expect(fetcher.listScheduled).toHaveBeenCalled();
        expect(result).toEqual(expectedResult);
    });

    it("should call executor.schedule when scheduling a task", async () => {
        const scheduler = new Scheduler({ fetcher, executor });
        const targetId = "target-id#0001";
        const input: ISchedulerInput = {
            type: ScheduleType.publish,
            scheduleOn: new Date()
        };
        await scheduler.schedule(targetId, input);
        expect(executor.schedule).toHaveBeenCalledWith(targetId, input);
    });

    it("should call executor.cancel when canceling a scheduled task", async () => {
        const scheduler = new Scheduler({ fetcher, executor });
        const targetId = "target-id#0001";
        await scheduler.cancel(targetId);
        expect(executor.cancel).toHaveBeenCalledWith(targetId);
    });
});
