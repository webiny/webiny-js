import { Context } from "~/Context";
import { BenchmarkMeasurement } from "~/types";
import { BenchmarkPlugin } from "~/plugins/BenchmarkPlugin";
import { ContextPlugin } from "~/plugins/ContextPlugin";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe("benchmark", () => {
    let context: Context;

    beforeEach(async () => {
        context = new Context({
            WEBINY_VERSION: "test"
        });
    });

    it("should not be enabled by default", async () => {
        const result = await context.benchmark.measure("test", async () => {
            await sleep(50);
            return true;
        });

        expect(result).toBe(true);
        expect(context.benchmark.measurements).toEqual([]);
    });

    it("should measure execution time", async () => {
        context.benchmark.enable();

        const result = await context.benchmark.measure("test", async () => {
            await sleep(50);
            return true;
        });

        expect(result).toBe(true);

        const expected: BenchmarkMeasurement[] = [
            {
                name: "test",
                category: "webiny",
                start: expect.any(Date),
                end: expect.any(Date),
                elapsed: expect.any(Number),
                memory: expect.any(Number)
            }
        ];

        expect(context.benchmark.measurements).toEqual(expected);
        expect(context.benchmark.measurements[0].elapsed).toBeGreaterThanOrEqual(50);

        context.benchmark.disable();

        const resultAfterDisable = await context.benchmark.measure("test", async () => {
            await sleep(50);
            return true;
        });

        expect(resultAfterDisable).toBe(true);
        /**
         * Should not have any new measurements, since benchmark is disabled.
         */
        expect(context.benchmark.measurements).toEqual(expected);

        context.benchmark.enable();
        await context.benchmark.measure("test", async () => {
            await sleep(50);
            return true;
        });

        await context.benchmark.measure("another test", async () => {
            await sleep(50);
            return true;
        });

        expected.push({
            name: "test",
            category: "webiny",
            start: expect.any(Date),
            end: expect.any(Date),
            elapsed: expect.any(Number),
            memory: expect.any(Number)
        });
        expected.push({
            name: "another test",
            category: "webiny",
            start: expect.any(Date),
            end: expect.any(Date),
            elapsed: expect.any(Number),
            memory: expect.any(Number)
        });
        expect(context.benchmark.measurements).toHaveLength(3);
        expect(context.benchmark.measurements).toEqual(expected);
        expect(context.benchmark.measurements[0].elapsed).toBeGreaterThanOrEqual(50);
        expect(context.benchmark.measurements[1].elapsed).toBeGreaterThanOrEqual(50);
        expect(context.benchmark.measurements[2].elapsed).toBeGreaterThanOrEqual(50);
        expect(context.benchmark.runs).toEqual({
            "webiny#test": 2,
            "webiny#another test": 1
        });
        expect(context.benchmark.elapsed).toBeGreaterThanOrEqual(150);
    });

    it("should have benchmark plugin initialized", async () => {
        const plugins = context.plugins.byType<BenchmarkPlugin>(BenchmarkPlugin.type);

        expect(plugins).toHaveLength(1);
        expect(plugins[0].name).toEqual("context.benchmark");
    });

    it("should measure using the plugin", async () => {
        const plugins = context.plugins.byType<BenchmarkPlugin>(BenchmarkPlugin.type);
        const plugin = plugins[0];
        expect(context.benchmark.measurements).toHaveLength(0);

        const expected: BenchmarkMeasurement[] = [
            {
                name: "test",
                category: "webiny",
                start: expect.any(Date),
                end: expect.any(Date),
                elapsed: expect.any(Number),
                memory: expect.any(Number)
            }
        ];

        await plugin.measure("test", async () => {
            await sleep(50);
            return true;
        });
        expect(context.benchmark.measurements).toHaveLength(0);

        plugin.enable();

        const result = await plugin.measure("test", async () => {
            await sleep(50);
            return true;
        });

        expect(result).toEqual(true);
        expect(context.benchmark.measurements).toHaveLength(1);
        expect(context.benchmark.measurements).toEqual(expected);

        plugin.disable();
        await plugin.measure("test", async () => {
            await sleep(50);
            return true;
        });

        expect(result).toEqual(true);
        expect(context.benchmark.measurements).toHaveLength(1);
        expect(context.benchmark.measurements).toEqual(expected);
    });

    it("should enable benchmark when certain conditions are met", async () => {
        process.env.BENCHMARK_ENABLE = "true";
        context.benchmark.enableOn(async () => {
            return process.env.BENCHMARK_ENABLE === "true";
        });

        expect(context.benchmark.measurements).toHaveLength(0);

        const result = await context.benchmark.measure("test", async () => {
            return true;
        });

        expect(result).toEqual(true);

        const expected: BenchmarkMeasurement[] = [
            {
                name: "test",
                category: "webiny",
                start: expect.any(Date),
                end: expect.any(Date),
                elapsed: expect.any(Number),
                memory: expect.any(Number)
            }
        ];

        expect(context.benchmark.measurements).toHaveLength(1);
        expect(context.benchmark.measurements).toEqual(expected);
        expect(context.benchmark.measurements[0].elapsed).toBeGreaterThanOrEqual(0);
    });

    it("should enable benchmark when certain conditions are met - via plugin", async () => {
        process.env.BENCHMARK_ENABLE = "true";
        const context = new Context({
            WEBINY_VERSION: "test",
            plugins: [
                new ContextPlugin(async ctx => {
                    ctx.benchmark.enableOn(async () => {
                        return process.env.BENCHMARK_ENABLE === "true";
                    });
                })
            ]
        });
        await Promise.all(
            context.plugins.byType<ContextPlugin>(ContextPlugin.type).map(plugin => {
                return plugin.apply(context);
            })
        );

        expect(context.benchmark.measurements).toEqual([]);

        const result = await context.benchmark.measure("test", async () => {
            return true;
        });

        expect(result).toEqual(true);

        const expected: BenchmarkMeasurement[] = [
            {
                name: "test",
                category: "webiny",
                start: expect.any(Date),
                end: expect.any(Date),
                elapsed: expect.any(Number),
                memory: expect.any(Number)
            }
        ];

        expect(context.benchmark.measurements).toHaveLength(1);
        expect(context.benchmark.measurements).toEqual(expected);
        expect(context.benchmark.measurements[0].elapsed).toBeGreaterThanOrEqual(0);
    });

    it("should not enable benchmark if it was disabled manually", async () => {
        context.benchmark.enableOn(async () => {
            return process.env.BENCHMARK_ENABLE === "true";
        });
        process.env.BENCHMARK_ENABLE = "true";
        await context.benchmark.measure("test", async () => {
            return true;
        });
        const expected: BenchmarkMeasurement[] = [
            {
                name: "test",
                category: "webiny",
                start: expect.any(Date),
                end: expect.any(Date),
                elapsed: expect.any(Number),
                memory: expect.any(Number)
            }
        ];
        expect(context.benchmark.measurements).toEqual(expected);

        context.benchmark.disable();

        const result = await context.benchmark.measure("test", async () => {
            return true;
        });

        expect(result).toEqual(true);

        expect(context.benchmark.measurements).toEqual(expected);
    });

    it("should output measurements to console by default", async () => {
        context.benchmark.enable();
        for (let i = 1; i <= 5; i++) {
            await context.benchmark.measure(`test ${i}`, async () => {
                return true;
            });
        }
        expect(context.benchmark.measurements).toHaveLength(5);

        const log: any[] = [];
        jest.spyOn(console, "log").mockImplementation((...args) => {
            log.push(...args);
        });

        await context.benchmark.output();

        expect(log).toHaveLength(3);
        expect(log).toMatchObject([
            `Benchmark total time elapsed: ${context.benchmark.elapsed}ms`,
            "Benchmark measurements:",
            [
                {
                    name: "test 1"
                },
                {
                    name: "test 2"
                },
                {
                    name: "test 3"
                },
                {
                    name: "test 4"
                },
                {
                    name: "test 5"
                }
            ]
        ]);
    });

    it("should output measurements to some outside system and console", async () => {
        context.benchmark.enable();
        for (let i = 1; i <= 5; i++) {
            await context.benchmark.measure(`test ${i}`, async () => {
                return true;
            });
        }
        expect(context.benchmark.measurements).toHaveLength(5);

        const outsideSystemLog: any[] = [];

        const log: any[] = [];
        jest.spyOn(console, "log").mockImplementation((...args) => {
            log.push(...args);
        });

        context.benchmark.onOutput(async ({ benchmark }) => {
            outsideSystemLog.push(...benchmark.measurements);
        });

        await context.benchmark.output();

        expect(log).toHaveLength(3);
        expect(log).toMatchObject([
            `Benchmark total time elapsed: ${context.benchmark.elapsed}ms`,
            "Benchmark measurements:",
            [
                {
                    name: "test 1"
                },
                {
                    name: "test 2"
                },
                {
                    name: "test 3"
                },
                {
                    name: "test 4"
                },
                {
                    name: "test 5"
                }
            ]
        ]);

        expect(outsideSystemLog).toHaveLength(5);
        expect(outsideSystemLog).toMatchObject([
            {
                name: "test 1"
            },
            {
                name: "test 2"
            },
            {
                name: "test 3"
            },
            {
                name: "test 4"
            },
            {
                name: "test 5"
            }
        ]);
    });

    it("should output measurements to some outside system and not our default because of the stop", async () => {
        context.benchmark.enable();
        for (let i = 1; i <= 5; i++) {
            await context.benchmark.measure(`test ${i}`, async () => {
                return true;
            });
        }
        expect(context.benchmark.measurements).toHaveLength(5);

        const outsideSystemLog: any[] = [];

        const log: any[] = [];
        jest.spyOn(console, "log").mockImplementation((...args) => {
            log.push(...args);
        });

        context.benchmark.onOutput(async ({ benchmark, stop }) => {
            outsideSystemLog.push(...benchmark.measurements);

            return stop();
        });

        await context.benchmark.output();

        expect(log).toHaveLength(0);

        expect(outsideSystemLog).toHaveLength(5);
        expect(outsideSystemLog).toMatchObject([
            {
                name: "test 1"
            },
            {
                name: "test 2"
            },
            {
                name: "test 3"
            },
            {
                name: "test 4"
            },
            {
                name: "test 5"
            }
        ]);
    });

    it("should properly measure nested benchmarks", async () => {
        context.benchmark.enable();

        const result = await context.benchmark.measure(`first level`, async () => {
            await sleep(10);
            return context.benchmark.measure(`second level`, async () => {
                await sleep(10);
                return context.benchmark.measure(`third level`, async () => {
                    return "level 3";
                });
            });
        });

        expect(result).toEqual("level 3");
        expect(context.benchmark.measurements).toHaveLength(3);
        const logs: any[] = [];
        jest.spyOn(console, "log").mockImplementation((...args) => {
            logs.push(...args);
        });

        await context.benchmark.output();

        expect(logs).toHaveLength(3);
        expect(logs).toMatchObject([
            `Benchmark total time elapsed: ${context.benchmark.elapsed}ms`,
            "Benchmark measurements:",
            [
                {
                    name: "third level"
                },
                {
                    name: "second level"
                },
                {
                    name: "first level"
                }
            ]
        ]);
    });
});
