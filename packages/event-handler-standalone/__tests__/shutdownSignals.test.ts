import type http from "node:http";
import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { handleShutdownSignals } from "~/server/handleShutdownSignals.js";

/*
 * `process.emit` only calls the listeners; no signal reaches the test process. The listeners that
 * were there before each test, the runner's own included, are put back after it.
 */
type Listener = (...args: unknown[]) => void;
let before: Record<string, Listener[]> = {};

const signals = ["SIGTERM", "SIGINT"] as const;

beforeEach(() => {
    before = {};
    for (const signal of signals) {
        before[signal] = process.listeners(signal) as Listener[];
    }
    vi.useFakeTimers();
    vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
    for (const signal of signals) {
        process.removeAllListeners(signal);
        for (const listener of before[signal]) {
            process.on(signal, listener);
        }
    }
    vi.useRealTimers();
    vi.restoreAllMocks();
});

const createServer = () => {
    return {
        close: vi.fn(),
        closeIdleConnections: vi.fn()
    } as unknown as http.Server;
};

const mockExit = () => {
    return vi.spyOn(process, "exit").mockImplementation((() => undefined) as never);
};

describe("handleShutdownSignals", () => {
    it("stops taking connections, shuts down, then exits", async () => {
        const exit = mockExit();
        const server = createServer();
        const shutdown = vi.fn(async () => {});
        handleShutdownSignals({ server, shutdown });

        process.emit("SIGTERM", "SIGTERM");
        await vi.advanceTimersByTimeAsync(0);

        expect(server.close).toHaveBeenCalled();
        expect(shutdown).toHaveBeenCalledTimes(1);
        expect(exit).toHaveBeenCalledWith(0);
    });

    it("exits after eight seconds even if the shutdown hangs", async () => {
        const exit = mockExit();
        const shutdown = () => new Promise<void>(() => {});
        handleShutdownSignals({ server: createServer(), shutdown });

        process.emit("SIGTERM", "SIGTERM");
        await vi.advanceTimersByTimeAsync(7999);
        expect(exit).not.toHaveBeenCalled();

        await vi.advanceTimersByTimeAsync(1);
        expect(exit).toHaveBeenCalledWith(0);
    });

    it("exits at once on a second signal", async () => {
        const exit = mockExit();
        const shutdown = vi.fn(() => new Promise<void>(() => {}));
        handleShutdownSignals({ server: createServer(), shutdown });

        process.emit("SIGINT", "SIGINT");
        process.emit("SIGINT", "SIGINT");
        await vi.advanceTimersByTimeAsync(0);

        expect(exit).toHaveBeenCalledWith(1);
        expect(shutdown).toHaveBeenCalledTimes(1);
    });

    it("still exits when the shutdown throws", async () => {
        const exit = mockExit();
        vi.spyOn(console, "error").mockImplementation(() => {});
        const shutdown = async () => {
            throw new Error("database gone");
        };
        handleShutdownSignals({ server: createServer(), shutdown });

        process.emit("SIGTERM", "SIGTERM");
        await vi.advanceTimersByTimeAsync(0);

        expect(exit).toHaveBeenCalledWith(0);
    });
});
