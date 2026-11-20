import http from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { IHttpResponse } from "~/index.js";
import { writeHttpResponse } from "~/nodeHttp/server/writeHttpResponse.js";

const agent = new http.Agent({ keepAlive: true, maxSockets: 1 });

const servers: http.Server[] = [];

afterEach(() => {
    agent.destroy();
    for (const server of servers.splice(0)) {
        server.close();
    }
});

/** Answers every request with `response` and returns the headers the client received. */
const headersReceivedFor = async (response: IHttpResponse) => {
    const server = http.createServer((_, res) => void writeHttpResponse(res, response));
    servers.push(server);
    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
    const { port } = server.address() as AddressInfo;

    return new Promise<http.IncomingHttpHeaders>((resolve, reject) => {
        const request = http.get({ port, host: "127.0.0.1", agent }, res => {
            res.resume();
            res.on("end", () => resolve(res.headers));
        });
        request.on("error", reject);
    });
};

describe("writeHttpResponse", () => {
    it("leaves the connection headers to Node and writes the route's other headers", async () => {
        const headers = await headersReceivedFor({
            statusCode: 200,
            headers: {
                Connection: "close",
                "keep-alive": "timeout=1",
                "proxy-authenticate": "Basic",
                "x-route": "kept"
            },
            body: "done"
        });

        expect(headers["connection"]).toBe("keep-alive");
        expect(headers["keep-alive"]).toBe("timeout=5");
        expect(headers["proxy-authenticate"]).toBe("Basic");
        expect(headers["x-route"]).toBe("kept");
    });
});
