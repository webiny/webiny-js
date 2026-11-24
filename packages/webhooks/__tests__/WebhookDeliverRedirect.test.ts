import { describe, it, expect, afterEach } from "vitest";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { Container } from "@webiny/di";
import { WebhookDeliver } from "~/api/features/WebhookDeliver/abstractions.js";
import { WebhookDeliverFeature } from "~/api/features/WebhookDeliver/feature.js";

const listen = (handler: http.RequestListener) => {
    return new Promise<{ server: http.Server; url: string }>(resolve => {
        const server = http.createServer(handler);
        server.listen(0, "127.0.0.1", () => {
            const { port } = server.address() as AddressInfo;
            resolve({ server, url: `http://127.0.0.1:${port}` });
        });
    });
};

describe("WebhookDeliver redirects", () => {
    const servers: http.Server[] = [];

    afterEach(async () => {
        await Promise.all(
            servers.splice(0).map(server => new Promise(resolve => server.close(resolve)))
        );
    });

    it("should not follow a redirect from the endpoint", async () => {
        let internalHits = 0;
        const internal = await listen((_, res) => {
            internalHits++;
            res.end("internal secret");
        });
        servers.push(internal.server);

        const endpoint = await listen((_, res) => {
            res.writeHead(307, { location: `${internal.url}/secret` });
            res.end();
        });
        servers.push(endpoint.server);

        const container = new Container();
        WebhookDeliverFeature.register(container);
        const deliver = container.resolve(WebhookDeliver);

        const result = await deliver.execute({
            url: `${endpoint.url}/hook`,
            headers: { "Content-Type": "application/json" },
            body: '{"event":"test"}',
            timeout: 5000,
            maxRetries: 0,
            initialDelay: 1,
            maxDelay: 10
        });

        expect(result.status).toBe(307);
        expect(result.body).not.toContain("internal secret");
        expect(internalHits).toBe(0);
    });
});
