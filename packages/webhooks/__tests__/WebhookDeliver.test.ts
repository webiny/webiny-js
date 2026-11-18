import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Mock } from "vitest";
import { Container } from "@webiny/feature/api";
import { WebhookDeliver } from "~/api/features/WebhookDeliver/abstractions.js";
import { WebhookDeliverFeature } from "~/api/features/WebhookDeliver/feature.js";
import type { IWebhookDeliverInput } from "~/api/features/WebhookDeliver/abstractions.js";

const makeInput = (overrides?: Partial<IWebhookDeliverInput>): IWebhookDeliverInput => ({
    url: "https://example.com/hook",
    headers: { "Content-Type": "application/json" },
    body: '{"event":"test"}',
    timeout: 5000,
    maxRetries: 3,
    initialDelay: 1,
    maxDelay: 10,
    ...overrides
});

const mockResponse = (status: number, body = "OK", headers?: Record<string, string>) => ({
    status,
    text: vi.fn().mockResolvedValue(body),
    headers: {
        get: vi.fn().mockImplementation((name: string) => headers?.[name] ?? null)
    }
});

describe("WebhookDeliver", () => {
    let fetchMock: Mock;

    beforeEach(() => {
        fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    const resolve = (): WebhookDeliver.Interface => {
        const container = new Container();
        WebhookDeliverFeature.register(container);
        return container.resolve(WebhookDeliver);
    };

    // Real timers fire on the monotonic clock while responseTime is read from Date.now(),
    // so a 1000 ms sleep can measure as 999 ms. Fake timers drive both from one clock.
    const executeWithFakeTimers = async (
        deliver: WebhookDeliver.Interface,
        input: IWebhookDeliverInput
    ) => {
        vi.useFakeTimers();
        const promise = deliver.execute(input);
        await vi.runAllTimersAsync();
        return promise;
    };

    it("returns 200 on successful first attempt with attempts: 1", async () => {
        fetchMock.mockResolvedValue(mockResponse(200));
        const deliver = resolve();

        const result = await deliver.execute(makeInput());

        expect(result.status).toBe(200);
        expect(result.body).toBe("OK");
        expect(result.attempts).toBe(1);
        expect(result.responseTime).toBeGreaterThanOrEqual(0);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("retries on network error and succeeds on second attempt", async () => {
        fetchMock
            .mockRejectedValueOnce(new Error("ECONNREFUSED"))
            .mockResolvedValue(mockResponse(200));
        const deliver = resolve();

        const result = await deliver.execute(makeInput());

        expect(result.status).toBe(200);
        expect(result.attempts).toBe(2);
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("retries on 502 and succeeds on second attempt", async () => {
        fetchMock
            .mockResolvedValueOnce(mockResponse(502, "Bad Gateway"))
            .mockResolvedValue(mockResponse(200));
        const deliver = resolve();

        const result = await deliver.execute(makeInput());

        expect(result.status).toBe(200);
        expect(result.attempts).toBe(2);
    });

    it("retries on 429 and respects Retry-After header", async () => {
        fetchMock
            .mockResolvedValueOnce(mockResponse(429, "Too Many Requests", { "retry-after": "1" }))
            .mockResolvedValue(mockResponse(200));
        const deliver = resolve();

        const result = await executeWithFakeTimers(
            deliver,
            makeInput({ initialDelay: 1, maxDelay: 2000 })
        );

        expect(result.status).toBe(200);
        expect(result.attempts).toBe(2);
        expect(result.responseTime).toBe(1000);
    });

    it("falls back to exponential backoff when Retry-After is unparseable", async () => {
        fetchMock
            .mockResolvedValueOnce(
                mockResponse(429, "Too Many Requests", { "retry-after": "garbage" })
            )
            .mockResolvedValue(mockResponse(200));
        const deliver = resolve();

        const result = await deliver.execute(makeInput());

        expect(result.status).toBe(200);
        expect(result.attempts).toBe(2);
    });

    it("returns last attempt result when all retries are exhausted", async () => {
        fetchMock.mockResolvedValue(mockResponse(503, "Service Unavailable"));
        const deliver = resolve();

        const result = await deliver.execute(makeInput({ maxRetries: 2 }));

        expect(result.status).toBe(503);
        expect(result.body).toBe("Service Unavailable");
        expect(result.attempts).toBe(3);
        expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it("does not retry when maxRetries is 0", async () => {
        fetchMock.mockRejectedValue(new Error("timeout"));
        const deliver = resolve();

        const result = await deliver.execute(makeInput({ maxRetries: 0 }));

        expect(result.status).toBe(0);
        expect(result.body).toBe("timeout");
        expect(result.attempts).toBe(1);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("does not retry on 400 Bad Request", async () => {
        fetchMock.mockResolvedValue(mockResponse(400, "Bad Request"));
        const deliver = resolve();

        const result = await deliver.execute(makeInput());

        expect(result.status).toBe(400);
        expect(result.attempts).toBe(1);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("caps delay at maxDelay", async () => {
        fetchMock
            .mockResolvedValueOnce(mockResponse(500, "err"))
            .mockResolvedValueOnce(mockResponse(500, "err"))
            .mockResolvedValueOnce(mockResponse(500, "err"))
            .mockResolvedValue(mockResponse(200));
        const deliver = resolve();

        const result = await executeWithFakeTimers(
            deliver,
            makeInput({
                maxRetries: 3,
                initialDelay: 100,
                maxDelay: 150
            })
        );

        expect(result.status).toBe(200);
        expect(result.attempts).toBe(4);
        // 100 + 150 + 150: the third delay would be 400 without the cap.
        expect(result.responseTime).toBe(400);
    });

    it("returns status 0 when all retries fail with network errors", async () => {
        fetchMock.mockRejectedValue(new Error("DNS lookup failed"));
        const deliver = resolve();

        const result = await deliver.execute(makeInput({ maxRetries: 1 }));

        expect(result.status).toBe(0);
        expect(result.body).toBe("DNS lookup failed");
        expect(result.attempts).toBe(2);
    });
});
