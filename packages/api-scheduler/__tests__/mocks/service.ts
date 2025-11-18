import { vi } from "vitest";
import type { ISchedulerService } from "~/service/types.js";

export const createMockService = (input?: Partial<ISchedulerService>): ISchedulerService => {
    return {
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        exists: vi.fn(),
        ...input
    };
};
