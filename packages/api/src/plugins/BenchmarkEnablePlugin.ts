import { Plugin } from "@webiny/plugins";
import { Context } from "~/types";

export interface BenchmarkEnablePluginCallable<T extends Context = Context> {
    (context: T): Promise<boolean>;
}

export class BenchmarkEnablePlugin<T extends Context = Context> extends Plugin {
    public static override readonly type: string = "context.benchmark.enable";

    private readonly cb: BenchmarkEnablePluginCallable<T>;

    public constructor(cb: BenchmarkEnablePluginCallable<T>) {
        super();
        this.cb = cb;
    }

    public async isEnabled(context: T): Promise<boolean> {
        return this.cb(context);
    }
}

export const createBenchmarkEnablePlugin = (
    cb: BenchmarkEnablePluginCallable
): BenchmarkEnablePlugin => {
    return new BenchmarkEnablePlugin(cb);
};
