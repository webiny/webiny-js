import http from "node:http";
import type { AddressInfo } from "node:net";
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
    // With no connections open, `close` calls back at once, as Node's does.
    const server = {
        close: vi.fn((callback?: () => void) => {
            callback?.();
            return server;
        }),
        closeIdleConnections: vi.fn(),
        closeAllConnections: vi.fn(),
        on: vi.fn()
    };
    return server as unknown as http.Server;
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

    it("lets a request in flight finish before exiting", async () => {
        vi.useRealTimers();
        let finished = false;
        let finishedAtExit: boolean | undefined;
        const exit = vi.spyOn(process, "exit").mockImplementation((() => {
            finishedAtExit = finished;
        }) as never);
        const server = http.createServer((_, res) => {
            setTimeout(() => {
                res.end("done");
                finished = true;
            }, 200);
        });
        await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
        const { port } = server.address() as AddressInfo;
        handleShutdownSignals({ server, shutdown: async () => {} });

        const agent = new http.Agent({ keepAlive: true });
        const response = new Promise<string>((resolve, reject) => {
            http.get({ port, host: "127.0.0.1", agent }, res => {
                let body = "";
                res.on("data", chunk => (body += chunk));
                res.on("end", () => resolve(body));
            }).on("error", reject);
        });
        // Wait until the server has the request, then ask it to stop.
        await new Promise<void>(resolve => server.once("request", () => resolve()));
        process.emit("SIGTERM", "SIGTERM");

        await vi.waitFor(() => expect(exit).toHaveBeenCalled(), { timeout: 2000 });
        await expect(response).resolves.toBe("done");
        expect(exit).toHaveBeenCalledWith(0);
        expect(finishedAtExit).toBe(true);
        agent.destroy();
    });

    it("cuts connections that are still open when the eight seconds run out", async () => {
        const exit = mockExit();
        const server = createServer();
        vi.mocked(server.close).mockImplementation((() => server) as never);
        handleShutdownSignals({ server, shutdown: async () => {} });

        process.emit("SIGTERM", "SIGTERM");
        await vi.advanceTimersByTimeAsync(7999);
        expect(exit).not.toHaveBeenCalled();

        await vi.advanceTimersByTimeAsync(1);
        expect(server.closeAllConnections).toHaveBeenCalled();
        expect(exit).toHaveBeenCalledWith(0);
    });
});
