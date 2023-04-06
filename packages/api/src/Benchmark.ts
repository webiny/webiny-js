import {
    Benchmark as BenchmarkInterface,
    BenchmarkEnableOnCallable,
    BenchmarkMeasurement,
    BenchmarkRuns,
    Context
} from "~/types";

export class Benchmark implements BenchmarkInterface {
    public readonly measurements: BenchmarkMeasurement[] = [];

    private totalElapsed = 0;
    public readonly runs: BenchmarkRuns = {};
    private readonly context: Context;
    private readonly enableOnCallables: BenchmarkEnableOnCallable[] = [];
    /**
     * The enabled flag acts as permanent enable - when running check if the benchmark is enabled.
     * It can be set to false by calling disable() method.
     *
     * @see enable()
     * @see disable()
     */
    private enabled = false;
    /**
     * The disabled flag acts as permanent disable - when running check if the benchmark is enabled.
     * It can be set to false by calling enable() method.
     *
     * Benchmark cannot be permanently disabled from the outside of this class.
     *
     * @see enable()
     */
    private disabled = false;

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
        this.enabled = true;
        this.disabled = false;
    }

    public disable(): void {
        this.enabled = false;
        this.disabled = false;
    }

    public async measure<T = any>(name: string, cb: () => Promise<T>): Promise<T> {
        const enabled = await this.isEnabled();
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

    private async isEnabled(): Promise<boolean> {
        if (this.enabled) {
            return true;
        }
        /**
         * If benchmark is disabled, we don't want to run all the checks again.
         */
        //
        else if (this.disabled) {
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
        this.disabled = true;
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
}
