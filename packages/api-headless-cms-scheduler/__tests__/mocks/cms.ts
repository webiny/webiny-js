import type { ScheduleExecutorCms } from "~/scheduler/ScheduleExecutor.js";
import type { ScheduleFetcherCms } from "~/scheduler/ScheduleFetcher.js";

export const createMockCms = (
    cms?: Partial<ScheduleExecutorCms & ScheduleFetcherCms>
): ScheduleExecutorCms & ScheduleFetcherCms => {
    return {
        listLatestEntries: jest.fn(),
        publishEntry: jest.fn(),
        unpublishEntry: jest.fn(),
        updateEntry: jest.fn(),
        createEntry: jest.fn(),
        deleteEntry: jest.fn(),
        getEntryById: jest.fn(),
        ...cms
    };
};
