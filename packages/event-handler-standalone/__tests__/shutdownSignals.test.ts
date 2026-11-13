import http from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { handleShutdownSignals } from "~/server/handleShutdownSignals.js";
import { InFlightRequests } from "~/server/InFlightRequests.js";

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

const noRequests = () => Promise.resolve();

const mockExit = (onExit: () => void = () => {}) => {
    const exit = (() => onExit()) as never;
    return vi.spyOn(process, "exit").mockImplementation(exit);
};

describe("handleShutdownSignals", () => {
    it("stops taking connections, shuts down, then exits", async () => {
        const exit = mockExit();
        const server = createServer();
        const shutdown = vi.fn(async () => {});
        handleShutdownSignals({ server, requestsDrained: noRequests, shutdown });

        process.emit("SIGTERM", "SIGTERM");
        await vi.advanceTimersByTimeAsync(0);

        expect(server.close).toHaveBeenCalled();
        expect(shutdown).toHaveBeenCalledTimes(1);
        expect(exit).toHaveBeenCalledWith(0);
    });

    it("exits after eight seconds even if the shutdown hangs", async () => {
        const exit = mockExit();
        const shutdown = () => new Promise<void>(() => {});
        handleShutdownSignals({ server: createServer(), requestsDrained: noRequests, shutdown });

        process.emit("SIGTERM", "SIGTERM");
        await vi.advanceTimersByTimeAsync(7999);
        expect(exit).not.toHaveBeenCalled();

        await vi.advanceTimersByTimeAsync(1);
        expect(exit).toHaveBeenCalledWith(0);
    });

    it("exits after eight seconds even if a request never finishes", async () => {
        const exit = mockExit();
        const requestsDrained = () => new Promise<void>(() => {});
        const shutdown = async () => {};
        handleShutdownSignals({ server: createServer(), requestsDrained, shutdown });

        process.emit("SIGTERM", "SIGTERM");
        await vi.advanceTimersByTimeAsync(7999);
        expect(exit).not.toHaveBeenCalled();

        await vi.advanceTimersByTimeAsync(1);
        expect(exit).toHaveBeenCalledWith(0);
    });

    it("exits at once on a second signal", async () => {
        const exit = mockExit();
        const shutdown = vi.fn(() => new Promise<void>(() => {}));
        handleShutdownSignals({ server: createServer(), requestsDrained: noRequests, shutdown });

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
        handleShutdownSignals({ server: createServer(), requestsDrained: noRequests, shutdown });

        process.emit("SIGTERM", "SIGTERM");
        await vi.advanceTimersByTimeAsync(0);

        expect(exit).toHaveBeenCalledWith(0);
    });

    it("still waits for requests in flight when the shutdown throws", async () => {
        const exit = mockExit();
        vi.spyOn(console, "error").mockImplementation(() => {});
        let finishRequests = () => {};
        const drained = new Promise<void>(resolve => {
            finishRequests = resolve;
        });
        const shutdown = async () => {
            throw new Error("message bus gone");
        };
        handleShutdownSignals({ server: createServer(), requestsDrained: () => drained, shutdown });

        process.emit("SIGTERM", "SIGTERM");
        await vi.advanceTimersByTimeAsync(1000);
        expect(exit).not.toHaveBeenCalled();

        finishRequests();
        await vi.advanceTimersByTimeAsync(0);
        expect(exit).toHaveBeenCalledWith(0);
    });

    it("hands the drain to the shutdown", async () => {
        mockExit();
        const drained = Promise.resolve();
        const shutdown = vi.fn(async () => {});
        handleShutdownSignals({ server: createServer(), requestsDrained: () => drained, shutdown });

        process.emit("SIGTERM", "SIGTERM");
        await vi.advanceTimersByTimeAsync(0);

        expect(shutdown).toHaveBeenCalledWith(drained);
    });

    it("lets a request in flight finish before exiting", async () => {
        vi.useRealTimers();
        let finished = false;
        let finishedAtExit: boolean | undefined;
        const exit = mockExit(() => {
            finishedAtExit = finished;
        });

        const inFlight = new InFlightRequests();
        const server = http.createServer((_, res) => {
            inFlight.track(res);
            setTimeout(() => {
                res.end("done");
                finished = true;
            }, 200);
        });
        await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
        const { port } = server.address() as AddressInfo;
        handleShutdownSignals({
            server,
            requestsDrained: () => inFlight.drained(),
            shutdown: async () => {}
        });

        const agent = new http.Agent({ keepAlive: true });
        const response = new Promise<string>((resolve, reject) => {
            const request = http.get({ port, host: "127.0.0.1", agent }, res => {
                let body = "";
                res.on("data", chunk => (body += chunk));
                res.on("end", () => resolve(body));
            });
            request.on("error", reject);
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
});
