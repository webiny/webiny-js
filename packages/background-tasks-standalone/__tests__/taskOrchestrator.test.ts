import http from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { TaskOrchestrator } from "~/worker/TaskOrchestrator.js";
import type { StartMessage, WorkerToParentMessage } from "~/worker/TaskOrchestratorMessage.js";

const TOKEN = "test-token-123";

interface ServerHandler {
    (body: Record<string, unknown>): { statusCode: number; body: Record<string, unknown> };
}

const createTestServer = (
    handler: ServerHandler
): Promise<{ port: number; server: http.Server }> => {
    return new Promise(resolve => {
        const server = http.createServer((req, res) => {
            let data = "";
            req.on("data", chunk => {
                data += chunk;
            });
            req.on("end", () => {
                const parsed = JSON.parse(data);
                const result = handler(parsed);
                res.writeHead(result.statusCode, { "content-type": "application/json" });
                res.end(JSON.stringify(result.body));
            });
        });
        server.listen(0, "127.0.0.1", () => {
            const addr = server.address();
            if (!addr || typeof addr === "string") {
                throw new Error("Failed to get server address.");
            }
            resolve({ port: addr.port, server });
        });
    });
};

const makeStartMessage = (port: number, overrides?: Partial<StartMessage>): StartMessage => {
    return {
        type: "start",
        taskEvent: {
            webinyTaskId: "task-1",
            webinyTaskDefinitionId: "testDef",
            tenant: "root",
            delay: 0
        },
        serverUrl: `http://127.0.0.1:${port}/background-task`,
        maxDurationMs: 10_000,
        internalToken: TOKEN,
        ...overrides
    };
};

let server: http.Server | null = null;

afterEach(() => {
    if (server) {
        server.close();
        server = null;
    }
});

describe("TaskOrchestrator", () => {
    it("should post to server and handle done response", async () => {
        const result = await createTestServer(() => ({
            statusCode: 200,
            body: { status: "done", output: "completed" }
        }));
        server = result.server;

        const messages: WorkerToParentMessage[] = [];
        const orchestrator = new TaskOrchestrator(makeStartMessage(result.port), msg =>
            messages.push(msg)
        );

        await orchestrator.run();

        expect(messages).toHaveLength(1);
        expect(messages[0].type).toBe("done");
        expect((messages[0] as any).result.status).toBe("done");
        expect((messages[0] as any).result.output).toBe("completed");
    });

    it("should handle error response from server", async () => {
        const result = await createTestServer(() => ({
            statusCode: 200,
            body: { status: "error", message: "something broke" }
        }));
        server = result.server;

        const messages: WorkerToParentMessage[] = [];
        const orchestrator = new TaskOrchestrator(makeStartMessage(result.port), msg =>
            messages.push(msg)
        );

        await orchestrator.run();

        expect(messages).toHaveLength(1);
        expect(messages[0].type).toBe("error");
    });

    it("should loop on continue then finish on done", async () => {
        let callCount = 0;
        const result = await createTestServer(() => {
            callCount++;
            if (callCount < 3) {
                return {
                    statusCode: 200,
                    body: { status: "continue", input: { iteration: callCount } }
                };
            }
            return {
                statusCode: 200,
                body: { status: "done", iterations: callCount }
            };
        });
        server = result.server;

        const messages: WorkerToParentMessage[] = [];
        const orchestrator = new TaskOrchestrator(makeStartMessage(result.port), msg =>
            messages.push(msg)
        );

        await orchestrator.run();

        expect(callCount).toBe(3);
        expect(messages).toHaveLength(1);
        expect(messages[0].type).toBe("done");
    });

    it("should pass continue input to next request", async () => {
        const receivedBodies: Record<string, unknown>[] = [];
        let callCount = 0;
        const result = await createTestServer(body => {
            receivedBodies.push(body);
            callCount++;
            if (callCount === 1) {
                return {
                    statusCode: 200,
                    body: { status: "continue", input: { cursor: "abc123" } }
                };
            }
            return { statusCode: 200, body: { status: "done" } };
        });
        server = result.server;

        const messages: WorkerToParentMessage[] = [];
        const orchestrator = new TaskOrchestrator(makeStartMessage(result.port), msg =>
            messages.push(msg)
        );

        await orchestrator.run();

        expect(receivedBodies).toHaveLength(2);
        /* First request has empty input. */
        expect((receivedBodies[0] as any).input).toEqual({});
        /* Second request carries the continue input. */
        expect((receivedBodies[1] as any).input).toEqual({ cursor: "abc123" });
    });

    it("should not overwrite task event fields with continue input", async () => {
        const receivedBodies: Record<string, unknown>[] = [];
        let callCount = 0;
        const result = await createTestServer(body => {
            receivedBodies.push(body);
            callCount++;
            if (callCount === 1) {
                return {
                    statusCode: 200,
                    body: {
                        status: "continue",
                        input: { webinyTaskId: "evil-id", tenant: "evil-tenant" }
                    }
                };
            }
            return { statusCode: 200, body: { status: "done" } };
        });
        server = result.server;

        const orchestrator = new TaskOrchestrator(makeStartMessage(result.port), () => {});

        await orchestrator.run();

        /* Task identity fields must not be overwritten by continue input. */
        expect((receivedBodies[1] as any).webinyTaskId).toBe("task-1");
        expect((receivedBodies[1] as any).tenant).toBe("root");
        /* The malicious values are nested inside input, not at top level. */
        expect((receivedBodies[1] as any).input.webinyTaskId).toBe("evil-id");
    });

    it("should send internal token header", async () => {
        let receivedHeaders: Record<string, string> = {};
        const result = await createTestServer(() => {
            return { statusCode: 200, body: { status: "done" } };
        });
        /* Override the default handler to capture headers. */
        result.server.removeAllListeners("request");
        result.server.on("request", (req, res) => {
            receivedHeaders = req.headers as Record<string, string>;
            let data = "";
            req.on("data", chunk => {
                data += chunk;
            });
            req.on("end", () => {
                res.writeHead(200, { "content-type": "application/json" });
                res.end(JSON.stringify({ status: "done" }));
            });
        });
        server = result.server;

        const orchestrator = new TaskOrchestrator(makeStartMessage(result.port), () => {});

        await orchestrator.run();

        expect(receivedHeaders["x-webiny-background-task-token"]).toBe(TOKEN);
    });

    it("should report error on HTTP 500", async () => {
        const result = await createTestServer(() => ({
            statusCode: 500,
            body: { error: "Internal Server Error" }
        }));
        server = result.server;

        const messages: WorkerToParentMessage[] = [];
        const orchestrator = new TaskOrchestrator(makeStartMessage(result.port), msg =>
            messages.push(msg)
        );

        await orchestrator.run();

        expect(messages).toHaveLength(1);
        expect(messages[0].type).toBe("error");
        expect((messages[0] as any).error).toContain("HTTP 500");
    });

    it("should report error on unknown response status", async () => {
        const result = await createTestServer(() => ({
            statusCode: 200,
            body: { status: "banana" }
        }));
        server = result.server;

        const messages: WorkerToParentMessage[] = [];
        const orchestrator = new TaskOrchestrator(makeStartMessage(result.port), msg =>
            messages.push(msg)
        );

        await orchestrator.run();

        expect(messages).toHaveLength(1);
        expect(messages[0].type).toBe("error");
        expect((messages[0] as any).error).toContain("Unknown response status: banana");
    });

    it("should report error when timer expires", async () => {
        const result = await createTestServer(() => ({
            statusCode: 200,
            body: { status: "continue", input: {} }
        }));
        server = result.server;

        const messages: WorkerToParentMessage[] = [];
        const orchestrator = new TaskOrchestrator(
            makeStartMessage(result.port, { maxDurationMs: 100 }),
            msg => messages.push(msg)
        );

        await orchestrator.run();

        const errorMsg = messages.find(m => m.type === "error");
        expect(errorMsg).toBeDefined();
        expect((errorMsg as any).error).toContain("maximum duration");
    });

    it("should report error when server is unreachable", async () => {
        const messages: WorkerToParentMessage[] = [];
        const orchestrator = new TaskOrchestrator(makeStartMessage(59999), msg =>
            messages.push(msg)
        );

        await orchestrator.run();

        expect(messages).toHaveLength(1);
        expect(messages[0].type).toBe("error");
        expect((messages[0] as any).error).toContain("ECONNREFUSED");
    });
});
