import http from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { KernelExecution } from "@webiny/api-kernel-core";
import { HttpRouteDefinition } from "@webiny/api-kernel-core";
import { HttpRouteHandler } from "@webiny/api-kernel-core";
import type { IHttpResponse } from "@webiny/api-kernel-core";
import { createServerHandler } from "@webiny/api-kernel-core/nodeHttp/index.js";
import { NodeHttpFeature } from "@webiny/api-kernel-core/nodeHttp/index.js";
import { LambdaWebKernelPlatform } from "~/LambdaWebKernelPlatform.js";

class ExecutionIdRoute implements HttpRouteHandler.Interface {
    constructor(private kernelExecution: KernelExecution.Interface) {}

    async handle(): Promise<IHttpResponse> {
        return { statusCode: 200, body: { executionId: this.kernelExecution.getId() } };
    }
}

const definition: HttpRouteDefinition.Interface = {
    name: "execution-id",
    method: "GET",
    path: "/execution-id",
    handler: HttpRouteHandler.createImplementation({
        implementation: ExecutionIdRoute,
        dependencies: [KernelExecution]
    })
};

function readExecutionId(port: number, headers: Record<string, string>): Promise<string> {
    return new Promise((resolve, reject) => {
        const request = http.request(
            { host: "127.0.0.1", port, path: "/execution-id", method: "GET", headers },
            response => {
                const chunks: Buffer[] = [];
                response.on("data", chunk => chunks.push(chunk));
                response.on("end", () => {
                    const text = Buffer.concat(chunks).toString("utf8");
                    const body = JSON.parse(text);
                    resolve(body.executionId);
                });
            }
        );
        request.on("error", reject);
        request.end();
    });
}

describe("Kernel execution id on a Lambda web function", () => {
    let server: http.Server;
    let port: number;

    beforeEach(async () => {
        server = await createServerHandler({
            platform: LambdaWebKernelPlatform,
            root: container => {
                NodeHttpFeature.register(container);
                container.registerInstance(HttpRouteDefinition, definition);
            }
        });
        await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
        const address = server.address() as AddressInfo;
        port = address.port;
    });

    afterEach(async () => {
        await new Promise<void>(resolve => server.close(() => resolve()));
    });

    it("should use the request id Lambda sends in the request header", async () => {
        const headers = { "lambda-web-request-id": "CRIRR27WLZIT4O2XQ4CZZZ62NI" };

        const executionId = await readExecutionId(port, headers);

        expect(executionId).toBe("CRIRR27WLZIT4O2XQ4CZZZ62NI");
    });

    it("should fall back to a generated id without the header", async () => {
        const first = await readExecutionId(port, {});
        const second = await readExecutionId(port, {});

        expect(first).toMatch(/^[0-9a-f-]{36}$/);
        expect(second).toMatch(/^[0-9a-f-]{36}$/);
        expect(first).not.toBe(second);
    });
});
