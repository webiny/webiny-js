import {
    Benchmark as BenchmarkInterface,
    BenchmarkEnableOnCallable,
    BenchmarkMeasurement,
    BenchmarkRuns,
    Context
} from "~/types";

enum BenchmarkState {
    DISABLED = "disabled",
    ENABLED = "enabled",
    UNDETERMINED = "undetermined"
}

export class Benchmark implements BenchmarkInterface {
    public readonly measurements: BenchmarkMeasurement[] = [];

    private totalElapsed = 0;
    public readonly runs: BenchmarkRuns = {};
    private readonly context: Context;
    private readonly enableOnCallables: BenchmarkEnableOnCallable[] = [];

    private state: BenchmarkState = BenchmarkState.UNDETERMINED;

    public constructor(context: Context) {
        this.context = context;
    }

    public get elapsed(): number {
        return this.totalElapsed;
    }

    public enableOn(cb: BenchmarkEnableOnCallable): void {
        this.enableOnCallables.push(cb);
    }

    public enable(): void {
        this.setState(BenchmarkState.ENABLED);
    }

    public disable(): void {
        this.setState(BenchmarkState.DISABLED);
    }

    public async measure<T = any>(name: string, cb: () => Promise<T>): Promise<T> {
        const enabled = await this.getIsEnabled();
        if (!enabled) {
            return cb();
        }
        const start = new Date();
        const memoryStart = process.memoryUsage().heapUsed;
        try {
            return await cb();
        } finally {
            const end = new Date();
            const memoryEnd = process.memoryUsage().heapUsed;
            const elapsed = end.getTime() - start.getTime();
            this.measurements.push({
                name,
                start,
                end,
                elapsed,
                memory: memoryEnd - memoryStart
            });
            this.addElapsed(elapsed);
            this.addRun(name);
        }
    }

    private async getIsEnabled(): Promise<boolean> {
        if (this.state === BenchmarkState.ENABLED) {
            return true;
        } else if (this.state === BenchmarkState.DISABLED) {
            return false;
        }

        for (const cb of this.enableOnCallables) {
            const result = await cb();
            if (result) {
                this.enable();
                return true;
            }
        }
        this.disable();
        return false;
    }

    private addElapsed(elapsed: number): void {
        this.totalElapsed = this.totalElapsed + elapsed;
    }

    private addRun(name: string): void {
        if (!this.runs[name]) {
            this.runs[name] = 0;
        }
        this.runs[name]++;
    }

    private setState(state: BenchmarkState): void {
        this.state = state;
    }
}
