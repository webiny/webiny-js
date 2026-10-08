import http from "node:http";
import type { AddressInfo } from "node:net";
import { Container } from "@webiny/di";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { HttpClient } from "~/features/httpClient/HttpClient.js";
import { HttpClient as HttpClientAbstraction } from "~/features/httpClient/abstractions.js";
import { HttpRequestError } from "~/features/httpClient/HttpRequestError.js";
import { HttpStatusError } from "~/features/httpClient/HttpStatusError.js";

interface ReceivedRequest {
    method: string | undefined;
    contentType: string | undefined;
    body: string;
}

let received: ReceivedRequest | undefined;

/*
 * A real server, so the tests cover the actual `fetch`, including the timeout. Each path answers
 * one way.
 */
const server = http.createServer((req, res) => {
    let body = "";
    req.on("data", chunk => {
        body += chunk;
    });
    req.on("end", () => {
        received = { method: req.method, contentType: req.headers["content-type"], body };

        if (req.url === "/json") {
            res.writeHead(200, { "content-type": "application/json" });
            res.end(JSON.stringify({ hello: "world" }));
            return;
        }
        if (req.url === "/empty") {
            res.writeHead(204);
            res.end();
            return;
        }
        if (req.url === "/not-json") {
            res.writeHead(200);
            res.end("<html></html>");
            return;
        }
        if (req.url === "/error") {
            res.writeHead(400, { "content-type": "application/json" });
            res.end(JSON.stringify({ message: "Bad seats." }));
            return;
        }
        if (req.url === "/slow") {
            setTimeout(() => res.end("{}"), 1000);
            return;
        }
        res.writeHead(404);
        res.end();
    });
});

let baseUrl = "";

const createClient = () => {
    const container = new Container();
    container.register(HttpClient);
    return container.resolve(HttpClientAbstraction);
};

describe("HttpClient", () => {
    beforeAll(async () => {
        await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
        const address = server.address() as AddressInfo;
        baseUrl = `http://127.0.0.1:${address.port}`;
    });

    afterAll(async () => {
        server.closeAllConnections();
        await new Promise(resolve => server.close(resolve));
    });

    it("returns the parsed JSON body", async () => {
        const result = await createClient().requestJson({ url: `${baseUrl}/json` });

        expect(result.isOk()).toBe(true);
        expect(result.value).toEqual({ hello: "world" });
        expect(received?.method).toBe("GET");
    });

    it("sends the body as JSON", async () => {
        await createClient().requestJson({
            url: `${baseUrl}/json`,
            method: "POST",
            body: { seats: 2 }
        });

        expect(received).toEqual({
            method: "POST",
            contentType: "application/json",
            body: JSON.stringify({ seats: 2 })
        });
    });

    it("returns undefined for an empty body", async () => {
        const result = await createClient().requestJson({ url: `${baseUrl}/empty` });

        expect(result.isOk()).toBe(true);
        expect(result.value).toBeUndefined();
    });

    it("fails with the status and body on a non-2xx response", async () => {
        const result = await createClient().requestJson({ url: `${baseUrl}/error` });

        expect(result.isFail()).toBe(true);
        expect(result.error).toBeInstanceOf(HttpStatusError);
        expect(result.error.data).toMatchObject({ status: 400, body: { message: "Bad seats." } });
    });

    it("fails when the body is not JSON", async () => {
        const result = await createClient().requestJson({ url: `${baseUrl}/not-json` });

        expect(result.isFail()).toBe(true);
        expect(result.error).toBeInstanceOf(HttpRequestError);
        expect(result.error.data).toMatchObject({ reason: "invalidJson" });
    });

    it("fails when the request times out", async () => {
        const result = await createClient().requestJson({ url: `${baseUrl}/slow`, timeoutMs: 50 });

        expect(result.isFail()).toBe(true);
        expect(result.error.data).toMatchObject({ reason: "timeout" });
    });

    it("fails when the server can't be reached", async () => {
        const result = await createClient().requestJson({ url: "http://127.0.0.1:1/" });

        expect(result.isFail()).toBe(true);
        expect(result.error.data).toMatchObject({ reason: "network" });
    });
});
