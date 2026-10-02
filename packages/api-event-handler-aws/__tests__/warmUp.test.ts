import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { warmUpLambdaHandler } from "~/warmUp.js";
import { withWarmUp } from "~/warmUp.js";

describe("warmUpLambdaHandler", () => {
    const originalHandlerEnv = process.env._HANDLER;

    beforeEach(() => {
        vi.useRealTimers();
    });

    afterEach(() => {
        if (originalHandlerEnv === undefined) {
            delete process.env._HANDLER;
        } else {
            process.env._HANDLER = originalHandlerEnv;
        }
    });

    it("should send a { __typename } request to the handler this function runs", async () => {
        process.env._HANDLER = "handler.handler";
        const handle = vi.fn(async () => ({ statusCode: 200 }));
        const streamHandle = vi.fn(async () => undefined);

        await warmUpLambdaHandler({
            handler: withWarmUp(handle),
            streamHandler: withWarmUp(streamHandle)
        });

        expect(handle).toHaveBeenCalledTimes(1);
        expect(streamHandle).not.toHaveBeenCalled();

        const [event] = handle.mock.calls[0] as unknown as [{ httpMethod: string; body: string }];
        expect(event.httpMethod).toEqual("POST");
        expect(JSON.parse(event.body)).toEqual({ query: "{ __typename }" });
    });

    it("should skip handlers without a warm-up", async () => {
        process.env._HANDLER = "handler.streamHandler";
        const handle = vi.fn(async () => ({ statusCode: 200 }));
        const streamHandle = vi.fn(async () => undefined);

        await warmUpLambdaHandler({ handler: withWarmUp(handle), streamHandler: streamHandle });

        expect(handle).not.toHaveBeenCalled();
        expect(streamHandle).not.toHaveBeenCalled();
    });

    it("should do nothing outside of Lambda", async () => {
        delete process.env._HANDLER;
        const handle = vi.fn(async () => ({ statusCode: 200 }));

        await warmUpLambdaHandler({ handler: withWarmUp(handle) });

        expect(handle).not.toHaveBeenCalled();
    });

    it("should not throw when the warm-up request fails", async () => {
        process.env._HANDLER = "handler.handler";
        const handle = vi.fn(async () => {
            throw new Error("No tenant yet.");
        });

        await expect(warmUpLambdaHandler({ handler: withWarmUp(handle) })).resolves.toBeUndefined();
    });

    it("should not throw when the handler throws synchronously", async () => {
        process.env._HANDLER = "handler.handler";
        const handle = vi.fn((): Promise<unknown> => {
            throw new Error("Thrown before a promise was returned.");
        });

        await expect(warmUpLambdaHandler({ handler: withWarmUp(handle) })).resolves.toBeUndefined();
        expect(handle).toHaveBeenCalledTimes(1);
    });

    it("should stop waiting for a warm-up request that hangs", async () => {
        vi.useFakeTimers();
        process.env._HANDLER = "handler.handler";
        const handle = vi.fn(() => new Promise(() => undefined));

        const warmUp = warmUpLambdaHandler({ handler: withWarmUp(handle) });
        await vi.advanceTimersByTimeAsync(5000);

        await expect(warmUp).resolves.toBeUndefined();
    });
});
