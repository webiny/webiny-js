import { describe, it, expect, vi, beforeEach } from "vitest";
import { Container } from "@webiny/di";
import { ApiStreamClient, ApiStreamRequestError } from "../abstractions.js";
import { FetchApiStreamClient } from "../FetchApiStreamClient.js";
import { EnvConfig } from "~/features/envConfig/index.js";

function okResponse() {
    return {
        ok: true,
        status: 200,
        body: new ReadableStream<Uint8Array>({
            start(controller) {
                controller.close();
            }
        })
    };
}

describe("FetchApiStreamClient", () => {
    let container: Container;
    let client: ApiStreamClient.Interface;

    beforeEach(() => {
        container = new Container();
        container.registerInstance(EnvConfig, {
            get: vi.fn((key: string) => (key === "apiUrl" ? "https://api.example.com/" : undefined))
        } as any);
        container.register(FetchApiStreamClient).inSingletonScope();
        client = container.resolve(ApiStreamClient);
    });

    it("should POST to the API root joined with the path", async () => {
        global.fetch = vi.fn().mockResolvedValue(okResponse());

        await client.execute({ path: "/stream/fm/files/abc/enrich" });

        expect(global.fetch).toHaveBeenCalledWith(
            "https://api.example.com/stream/fm/files/abc/enrich",
            expect.objectContaining({ method: "POST" })
        );
    });

    it("should not produce a double slash when joining", async () => {
        global.fetch = vi.fn().mockResolvedValue(okResponse());

        await client.execute({ path: "stream/thing" });

        expect(global.fetch).toHaveBeenCalledWith(
            "https://api.example.com/stream/thing",
            expect.anything()
        );
    });

    it("should request an event stream and stringify the body", async () => {
        global.fetch = vi.fn().mockResolvedValue(okResponse());

        await client.execute({ path: "/stream/x", body: { hello: "world" } });

        const init = (global.fetch as any).mock.calls[0][1];
        expect(init.headers.accept).toBe("text/event-stream");
        expect(init.headers["content-type"]).toBe("application/json");
        expect(init.body).toBe(JSON.stringify({ hello: "world" }));
    });

    it("should pass through caller headers and drop undefined ones", async () => {
        global.fetch = vi.fn().mockResolvedValue(okResponse());

        await client.execute({
            path: "/stream/x",
            headers: { Authorization: "Bearer t", "x-tenant": "root", "x-skip": undefined }
        });

        const { headers } = (global.fetch as any).mock.calls[0][1];
        expect(headers.Authorization).toBe("Bearer t");
        expect(headers["x-tenant"]).toBe("root");
        expect("x-skip" in headers).toBe(false);
    });

    it("should omit a body on GET", async () => {
        global.fetch = vi.fn().mockResolvedValue(okResponse());

        await client.execute({ path: "/stream/x", method: "GET", body: { ignored: true } });

        const init = (global.fetch as any).mock.calls[0][1];
        expect(init.body).toBeUndefined();
        expect(init.headers["content-type"]).toBeUndefined();
    });

    it("should surface a JSON error body as ApiStreamRequestError", async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 404,
            json: async () => ({
                message: "File not found: abc",
                code: "ENRICHMENT_FILE_NOT_FOUND"
            })
        });

        const error = await client.execute({ path: "/stream/x" }).catch(e => e);

        expect(error).toBeInstanceOf(ApiStreamRequestError);
        expect(error.message).toBe("File not found: abc");
        expect(error.statusCode).toBe(404);
        expect(error.code).toBe("ENRICHMENT_FILE_NOT_FOUND");
    });

    it("should fall back to a status message when the error body isn't JSON", async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 502,
            json: async () => {
                throw new Error("not json");
            }
        });

        const error = await client.execute({ path: "/stream/x" }).catch(e => e);

        expect(error).toBeInstanceOf(ApiStreamRequestError);
        expect(error.message).toBe("Request failed with status 502.");
        expect(error.statusCode).toBe(502);
    });

    it("should reject a 2xx response that carries no body", async () => {
        global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, body: null });

        await expect(client.execute({ path: "/stream/x" })).rejects.toThrow(
            "The response carried no readable body."
        );
    });

    it("should wrap a network failure", async () => {
        global.fetch = vi.fn().mockRejectedValue(new Error("connection reset"));

        await expect(client.execute({ path: "/stream/x" })).rejects.toThrow(
            "Network error: connection reset"
        );
    });

    it("should rethrow an abort untouched", async () => {
        // Callers distinguish "user cancelled" from "request failed"; wrapping an abort in a generic
        // network error would erase that.
        global.fetch = vi.fn().mockRejectedValue(new DOMException("aborted", "AbortError"));

        const error = await client.execute({ path: "/stream/x" }).catch(e => e);

        expect(error).toBeInstanceOf(DOMException);
        expect(error.name).toBe("AbortError");
    });

    it("should forward the abort signal to fetch", async () => {
        global.fetch = vi.fn().mockResolvedValue(okResponse());
        const controller = new AbortController();

        await client.execute({ path: "/stream/x", signal: controller.signal });

        expect((global.fetch as any).mock.calls[0][1].signal).toBe(controller.signal);
    });
});
