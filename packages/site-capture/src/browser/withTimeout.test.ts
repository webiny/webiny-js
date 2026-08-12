import { describe, expect, it, vi } from "vitest";
import { OperationTimeoutError, withTimeout, withTimeoutOrDefault } from "./withTimeout.js";

const never = () => new Promise<string>(() => {});
const after = (ms: number, value: string) =>
    new Promise<string>(resolve => setTimeout(() => resolve(value), ms));

describe("withTimeout", () => {
    it("returns the value when the operation finishes in time", async () => {
        await expect(withTimeout("fetch", 1000, () => Promise.resolve("ok"))).resolves.toBe("ok");
    });

    it("rejects with the operation name and the limit", async () => {
        const error = await withTimeout("navigate to https://northbeam.io/", 10, never).catch(
            e => e
        );

        expect(error).toBeInstanceOf(OperationTimeoutError);
        expect(error.operation).toBe("navigate to https://northbeam.io/");
        expect(error.timeoutMs).toBe(10);
        expect(error.message).toContain("navigate to https://northbeam.io/");
        expect(error.message).toContain("10ms");
    });

    it("suggests what the user can do about it", async () => {
        const error = await withTimeout("sample the page", 10, never).catch(e => e);
        expect(error.message).toContain("Try again");
    });

    it("propagates the original failure rather than masking it as a timeout", async () => {
        const failure = new Error("net::ERR_NAME_NOT_RESOLVED");
        await expect(withTimeout("navigate", 1000, () => Promise.reject(failure))).rejects.toBe(
            failure
        );
    });

    it("clears its timer on success, so a finished task is not held open", async () => {
        // An unref'd pending timer keeps a Lambda invocation alive after the handler returns, which
        // looks exactly like a hang even though the work is done.
        const clear = vi.spyOn(globalThis, "clearTimeout");
        const before = clear.mock.calls.length;

        await withTimeout("quick", 5000, () => Promise.resolve("ok"));

        expect(clear.mock.calls.length).toBeGreaterThan(before);
        clear.mockRestore();
    });

    it("clears its timer when the operation fails", async () => {
        const clear = vi.spyOn(globalThis, "clearTimeout");
        const before = clear.mock.calls.length;

        await withTimeout("failing", 5000, () => Promise.reject(new Error("boom"))).catch(() => {});

        expect(clear.mock.calls.length).toBeGreaterThan(before);
        clear.mockRestore();
    });

    it("wins the race when the operation is slower than the limit", async () => {
        await expect(withTimeout("slow", 10, () => after(200, "late"))).rejects.toBeInstanceOf(
            OperationTimeoutError
        );
    });
});

describe("withTimeoutOrDefault", () => {
    it("returns the value when the operation succeeds", async () => {
        await expect(
            withTimeoutOrDefault("banners", 1000, "fallback", () => Promise.resolve("ok"))
        ).resolves.toBe("ok");
    });

    it("falls back on a timeout instead of failing the crawl", async () => {
        // A page abandoned because a consent dialog would not close trades a good result for none.
        await expect(withTimeoutOrDefault("banners", 10, "fallback", never)).resolves.toBe(
            "fallback"
        );
    });

    it("falls back on an error too", async () => {
        await expect(
            withTimeoutOrDefault("banners", 1000, "fallback", () =>
                Promise.reject(new Error("boom"))
            )
        ).resolves.toBe("fallback");
    });
});
