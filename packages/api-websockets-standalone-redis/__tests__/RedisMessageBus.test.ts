import { describe, it, expect, vi, afterEach } from "vitest";
import { RedisMessageBus } from "~/RedisMessageBus.js";

/*
 * Needs a real Redis or Valkey: `docker run -p 6379:6379 valkey/valkey`, then run with
 * WEBINY_TEST_REDIS_URL=redis://localhost:6379.
 */
const url = process.env.WEBINY_TEST_REDIS_URL;

const logger = {
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    log: vi.fn()
};

const buses: RedisMessageBus[] = [];

const createBus = (busUrl: string): RedisMessageBus => {
    const bus = new RedisMessageBus({ url: busUrl, logger });
    buses.push(bus);
    return bus;
};

afterEach(async () => {
    const closing = buses.map(bus => bus.close());
    await Promise.all(closing);
    buses.length = 0;
});

describe.skipIf(!url)("RedisMessageBus", () => {
    it("delivers what one process publishes to the process listening on that owner", async () => {
        const a = createBus(url!);
        const b = createBus(url!);
        const received = vi.fn().mockResolvedValue(undefined);
        await a.subscribe("A", vi.fn());
        await b.subscribe("B", received);
        const message = { action: "send" as const, connectionIds: ["abc"], data: { n: 1 } };

        // Both connect in the background; publish once A's publisher is up and B is subscribed.
        await vi.waitFor(async () => {
            await a.publish("B", message);
            expect(received).toHaveBeenCalled();
        });

        expect(received).toHaveBeenCalledWith(message);
    });

    it("does not deliver to a process listening on another owner", async () => {
        const a = createBus(url!);
        const b = createBus(url!);
        const received = vi.fn().mockResolvedValue(undefined);
        const control = vi.fn().mockResolvedValue(undefined);
        await a.subscribe("A", control);
        await b.subscribe("B", received);

        await vi.waitFor(async () => {
            await b.publish("A", { action: "disconnect", connectionIds: ["x"] });
            expect(control).toHaveBeenCalled();
        });

        expect(received).not.toHaveBeenCalled();
    });
});

describe("RedisMessageBus without a server", () => {
    // A send is part of a request, which must not wait for Redis to come back.
    it("fails a publish at once instead of queueing it", async () => {
        const bus = createBus("redis://127.0.0.1:1");
        await bus.subscribe("A", vi.fn());

        const publishing = bus.publish("B", { action: "disconnect", connectionIds: ["x"] });

        await expect(publishing).rejects.toThrow("Redis is not connected.");
    });
});
