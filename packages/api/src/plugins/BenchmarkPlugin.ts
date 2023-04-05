import { Plugin } from "@webiny/plugins";
import { Benchmark } from "~/types";

/**
 * This plugin should be initialized only once per context, hence the name of the plugin.
 */
export class BenchmarkPlugin extends Plugin {
    public static override readonly type: string = "context.benchmark";
    public override name = "context.benchmark";
    public readonly benchmark: Benchmark;

    public constructor(benchmark: Benchmark) {
        super();
        this.benchmark = benchmark;
    }

    public enable(): void {
        this.benchmark.enable();
    }

    public disable(): void {
        this.benchmark.disable();
    }

    public async measure<T = any>(name: string, cb: () => Promise<T>): Promise<T> {
        return this.benchmark.measure<T>(name, cb);
    }
}
