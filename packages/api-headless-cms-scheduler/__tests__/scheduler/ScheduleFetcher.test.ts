import { ScheduleFetcher } from "~/scheduler/ScheduleFetcher.js";
import type {
    CmsEntryMeta,
    CmsIdentity,
    CmsModel,
    HeadlessCms
} from "@webiny/api-headless-cms/types/index.js";
import type { ISchedulerListParams } from "~/scheduler/types.js";
import { NotFoundError } from "@webiny/handler-graphql";
import { dateToISOString } from "~/scheduler/dates.js";

describe("ScheduleFetcher", () => {
    const targetModel: CmsModel = { modelId: "targetModel", titleFieldId: "title" } as any;
    const schedulerModel: CmsModel = { modelId: "schedulerModel", titleFieldId: "title" } as any;
    const entryMeta: CmsEntryMeta = { hasMoreItems: false, totalCount: 1, cursor: null };

    function createMockCms(overrides: Partial<HeadlessCms> = {}) {
        return {
            getEntryById: jest.fn(),
            listLatestEntries: jest.fn(),
            ...overrides
        } as unknown as HeadlessCms;
    }

    it("getScheduled returns a record if found", async () => {
        const identity: CmsIdentity = {
            id: "user-1",
            displayName: "User 1",
            type: "admin"
        };
        const mockedEntry = {
            id: "schedule-1",
            values: {
                type: "publish",
                title: "Test Entry",
                targetModelId: targetModel.modelId,
                targetId: "target-1",
                scheduledOn: dateToISOString(new Date()),
                scheduledBy: identity
            },
            savedOn: new Date().toISOString(),
            savedBy: identity
        };
        const cms = createMockCms({
            getEntryById: jest.fn().mockResolvedValue(mockedEntry)
        });
        const fetcher = new ScheduleFetcher({ cms, targetModel, schedulerModel });
        const result = await fetcher.getScheduled("target-1");
        expect(result).not.toBeNull();
        expect(result?.targetId).toBe("target-1");
        expect(result?.title).toBe("Test Entry");
    });

    it("getScheduled returns null if not found", async () => {
        const cms = createMockCms({
            getEntryById: jest.fn().mockRejectedValue(new NotFoundError("not found"))
        });
        const fetcher = new ScheduleFetcher({ cms, targetModel, schedulerModel });
        const result = await fetcher.getScheduled("target-1");
        expect(result).toBeNull();
    });

    it("getScheduled throws on unknown error", async () => {
        const cms = createMockCms({
            getEntryById: jest.fn().mockRejectedValue(new Error("unknown"))
        });
        const fetcher = new ScheduleFetcher({ cms, targetModel, schedulerModel });
        await expect(fetcher.getScheduled("target-1")).rejects.toThrow("unknown");
    });

    it("listScheduled returns data and meta", async () => {
        const entry = {
            id: "schedule-1",
            values: {
                type: "publish",
                title: "Test Entry",
                targetId: "target-1",
                dateOn: new Date().toISOString(),
                scheduledBy: { id: "user-1" }
            },
            savedOn: new Date().toISOString(),
            savedBy: { id: "user-1" }
        };
        const cms = createMockCms({
            listLatestEntries: jest.fn().mockResolvedValue([[entry], entryMeta])
        });
        const fetcher = new ScheduleFetcher({ cms, targetModel, schedulerModel });
        const params: ISchedulerListParams = {
            where: {},
            sort: undefined,
            limit: undefined,
            after: undefined
        };
        const result = await fetcher.listScheduled(params);
        expect(result.data.length).toBe(1);
        expect(result.data[0].title).toBe("Test Entry");
        expect(result.meta).toEqual(entryMeta);
    });
});
