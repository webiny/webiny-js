import { Context } from "~/Context";
import { BenchmarkMeasurement } from "~/types";
import { BenchmarkPlugin } from "~/plugins/BenchmarkPlugin";

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
            start: expect.any(Date),
            end: expect.any(Date),
            elapsed: expect.any(Number),
            memory: expect.any(Number)
        });
        expected.push({
            name: "another test",
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
            test: 2,
            "another test": 1
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
});
