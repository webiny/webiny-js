import http from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { InFlightRequests } from "~/nodeHttp/server/InFlightRequests.js";
import { writeHttpResponse } from "~/nodeHttp/server/writeHttpResponse.js";

interface IReply {
    body: string;
    connection: string | undefined;
}

/*
 * One keep-alive socket at most, so a second request reuses the first one's connection whenever
 * the server leaves it open.
 */
const agent = new http.Agent({ keepAlive: true, maxSockets: 1 });

afterEach(() => {
    agent.destroy();
});

const get = (port: number): Promise<IReply> => {
    return new Promise((resolve, reject) => {
        const request = http.get({ port, host: "127.0.0.1", agent }, res => {
            let body = "";
            res.on("data", chunk => (body += chunk));
            res.on("end", () => resolve({ body, connection: res.headers.connection }));
        });
        request.on("error", reject);
    });
};

/**
 * Starts a server whose handler `respond` answers each request, and returns its port, a promise of
 * the first request arriving, and how many requests it received.
 */
const listen = async (respond: (res: http.ServerResponse) => void) => {
    const inFlight = new InFlightRequests();
    const received = { count: 0 };
    const server = http.createServer((_, res) => {
        received.count++;
        inFlight.track(res);
        respond(res);
    });
    const firstRequest = new Promise<void>(resolve => server.once("request", () => resolve()));
    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
    const { port } = server.address() as AddressInfo;
    return { inFlight, server, port, firstRequest, received };
};

describe("InFlightRequests", () => {
    it("resolves at once when no request is in flight", async () => {
        await expect(new InFlightRequests().waitUntilAllFinished()).resolves.toBeUndefined();
    });

    it("closes a keep-alive connection after the response in flight when reuse stops", async () => {
        const { inFlight, server, port, firstRequest, received } = await listen(res => {
            setTimeout(() => res.end("done"), 100);
        });

        const first = get(port);
        await firstRequest;
        server.close();
        inFlight.stopConnectionReuse();
        const allFinished = inFlight.waitUntilAllFinished();

        await expect(first).resolves.toEqual({ body: "done", connection: "close" });
        await allFinished;
        // The connection is gone, so the next request needs a new one, and the server takes none.
        await expect(get(port)).rejects.toMatchObject({ code: "ECONNREFUSED" });
        expect(received.count).toBe(1);
    });

    it("closes the connection of a streamed response whose headers were already sent", async () => {
        const { inFlight, server, port, firstRequest, received } = await listen(res => {
            res.writeHead(200);
            res.write("part ");
            setTimeout(() => res.end("done"), 100);
        });

        const first = get(port);
        await firstRequest;
        server.close();
        inFlight.stopConnectionReuse();
        const allFinished = inFlight.waitUntilAllFinished();

        await expect(first).resolves.toEqual({ body: "part done", connection: "keep-alive" });
        await allFinished;
        /*
         * The client could not be told, so it may reuse the connection before it sees it close: the
         * request is then reset (ECONNRESET) instead of refused, but the server never reads it.
         */
        await expect(get(port)).rejects.toMatchObject({ code: /^ECONN(RESET|REFUSED)$/ });
        expect(received.count).toBe(1);
    });

    it("tells the client to close even when the route sets `connection: keep-alive`", async () => {
        const { inFlight, server, port, firstRequest, received } = await listen(res => {
            const response = {
                statusCode: 200,
                headers: { connection: "keep-alive" },
                body: "done"
            };
            setTimeout(() => void writeHttpResponse(res, response), 100);
        });

        const first = get(port);
        await firstRequest;
        server.close();
        inFlight.stopConnectionReuse();
        const allFinished = inFlight.waitUntilAllFinished();

        await expect(first).resolves.toEqual({ body: "done", connection: "close" });
        await allFinished;
        const second = get(port);
        await expect(second).rejects.toMatchObject({ code: "ECONNREFUSED" });
        expect(received.count).toBe(1);
    });
});
