import { vi } from "vitest";
import type { ScheduleExecutorCms } from "~/scheduler/ScheduleExecutor.js";
import type { ScheduleFetcherCms } from "~/scheduler/ScheduleFetcher.js";

export const createMockCms = (
    cms?: Partial<ScheduleExecutorCms & ScheduleFetcherCms>
): ScheduleExecutorCms & ScheduleFetcherCms => {
    return {
        listLatestEntries: vi.fn(),
        publishEntry: vi.fn(),
        unpublishEntry: vi.fn(),
        updateEntry: vi.fn(),
        createEntry: vi.fn(),
        deleteEntry: vi.fn(),
        getEntryById: vi.fn(),
        ...cms
    };
};
