import {
    Benchmark as BenchmarkInterface,
    BenchmarkEnableOnCallable,
    BenchmarkMeasurement,
    BenchmarkOutputCallable,
    BenchmarkOutputCallableResponse,
    BenchmarkRuns
} from "~/types";

enum BenchmarkState {
    DISABLED = "disabled",
    ENABLED = "enabled",
    UNDETERMINED = "undetermined"
}

export class Benchmark implements BenchmarkInterface {
    public readonly measurements: BenchmarkMeasurement[] = [];

    private outputDone = false;
    private totalElapsed = 0;
    public readonly runs: BenchmarkRuns = {};
    private readonly enableOnCallables: BenchmarkEnableOnCallable[] = [];
    private readonly onOutputCallables: BenchmarkOutputCallable[] = [];

    private state: BenchmarkState = BenchmarkState.UNDETERMINED;

    public constructor() {
        /**
         * The default output is to the console.
         * This one is executed after all other user defined outputs.
         */
        this.onOutputCallables.push(async () => {
            console.log("Benchmark measurements:");
            console.log(this.measurements);
        });
    }

    public get elapsed(): number {
        return this.totalElapsed;
    }

    public enableOn(cb: BenchmarkEnableOnCallable): void {
        this.enableOnCallables.push(cb);
    }

    public onOutput(cb: BenchmarkOutputCallable): void {
        this.onOutputCallables.push(cb);
    }

    public enable(): void {
        this.setState(BenchmarkState.ENABLED);
    }

    public disable(): void {
        this.setState(BenchmarkState.DISABLED);
    }

    /**
     * When running the output, we need to reverse the callables array, so that the last one added is the first one executed.
     *
     * The first one is our built-in console.log output, which we want to be the last one executed - and we need to stop output if user wants to end it.
     */
    public async output(): Promise<void> {
        /**
         * No point in outputting more than once or if no measurements were made.
         */
        if (this.outputDone || this.measurements.length === 0) {
            return;
        }
        const callables = this.onOutputCallables.reverse();
        for (const cb of callables) {
            const result = await cb(this);
            if (result === BenchmarkOutputCallableResponse.BREAK) {
                return;
            }
        }
        this.outputDone = true;
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
