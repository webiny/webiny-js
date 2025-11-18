import { vi } from "vitest";
import type { IScheduleFetcher } from "~/scheduler/types.js";

export const createMockFetcher = (input?: Partial<IScheduleFetcher>): IScheduleFetcher => {
    return {
        getScheduled: vi.fn(),
        listScheduled: vi.fn(),
        ...input
    };
};
