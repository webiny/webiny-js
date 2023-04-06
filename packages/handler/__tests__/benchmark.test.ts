import { createHandler } from "~/fastify";
import { createRoute } from "~/plugins/RoutePlugin";
import { FastifyInstance } from "fastify";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe("benchmark", () => {
    let app: FastifyInstance;

    beforeEach(async () => {
        app = createHandler({
            plugins: [
                createRoute(({ onGet }) => {
                    onGet("/webiny-test", async (request, reply) => {
                        await app.webiny.benchmark.measure("test", async () => {
                            return await sleep(50);
                        });
                        return reply.send({});
                    });
                })
            ]
        });
    });

    it("should run not benchmark measurements", async () => {
        await app.inject({
            path: "/webiny-test",
            headers: {
                "content-type": "application/json"
            },
            method: "GET",
            payload: "{}"
        });

        expect(app.webiny.benchmark.measurements).toHaveLength(0);
    });

    it("should run benchmark measurements", async () => {
        app.webiny.benchmark.enable();

        const logs: any[] = [];

        jest.spyOn(console, "log").mockImplementation((...args) => {
            logs.push(...args);
        });

        await app.inject({
            path: "/webiny-test",
            headers: {
                "content-type": "application/json"
            },
            method: "GET",
            payload: "{}"
        });

        expect(app.webiny.benchmark.measurements).toHaveLength(1);
        expect(app.webiny.benchmark.measurements).toMatchObject([
            {
                name: "test"
            }
        ]);

        expect(logs).toHaveLength(3);
        expect(logs).toMatchObject([
            `Benchmark total time elapsed: ${app.webiny.benchmark.elapsed}ms`,
            "Benchmark measurements:",
            [
                {
                    name: "test"
                }
            ]
        ]);
    });
});
