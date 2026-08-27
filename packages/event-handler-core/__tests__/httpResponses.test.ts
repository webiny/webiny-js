import { describe, it, expect } from "vitest";
import { sseResponse } from "~/features/http/sseResponse.js";
import { jsonResponse } from "~/features/http/jsonResponse.js";
import { HttpStreamBody } from "~/features/http/HttpStreamBody.js";

async function* source() {
    yield "data: one\n\n";
}

describe("sseResponse", () => {
    it("should answer 200 with a streaming body", async () => {
        const response = sseResponse(source());

        expect(response.statusCode).toBe(200);
        expect(HttpStreamBody.is(response.body)).toBe(true);
    });

    it("should set the headers that keep delivery incremental", () => {
        const headers = sseResponse(source()).headers!;

        expect(headers["content-type"]).toBe("text/event-stream");
        // Without `no-transform` CloudFront compresses the body, which buffers chunks; without
        // `x-accel-buffering` nginx-family proxies buffer it. Either one silently defeats streaming.
        expect(headers["cache-control"]).toContain("no-transform");
        expect(headers["x-accel-buffering"]).toBe("no");
        expect(headers["connection"]).toBe("keep-alive");
    });

    it("should pass the source through untouched", async () => {
        const response = sseResponse(source());
        const body = response.body as HttpStreamBody;

        expect(new TextDecoder().decode(await body.collect())).toBe("data: one\n\n");
    });
});

describe("jsonResponse", () => {
    it("should carry the status code, content type, and body", () => {
        const response = jsonResponse(404, { message: "nope" });

        expect(response.statusCode).toBe(404);
        expect(response.headers?.["content-type"]).toBe("application/json");
        expect(response.body).toEqual({ message: "nope" });
    });
});
