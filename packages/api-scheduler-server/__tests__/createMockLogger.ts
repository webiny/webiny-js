import { vi } from "vitest";
import type { Logger } from "@webiny/api-core/features/logger/abstractions.js";

export const createMockLogger = (): Logger.Interface => ({
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    log: vi.fn()
});
