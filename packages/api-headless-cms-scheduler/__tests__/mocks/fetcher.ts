import type { IScheduleFetcher } from "~/scheduler/types.js";

export const createMockFetcher = (input?: Partial<IScheduleFetcher>): IScheduleFetcher => {
    return {
        getScheduled: jest.fn(),
        listScheduled: jest.fn(),
        ...input
    };
};
