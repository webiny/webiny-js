import type { ISchedulerService } from "~/service/types.js";

export const createMockService = (input?: Partial<ISchedulerService>): ISchedulerService => {
    return {
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        exists: jest.fn(),
        ...input
    };
};
