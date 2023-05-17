import {
    Benchmark as BenchmarkInterface,
    BenchmarkEnableOnCallable,
    BenchmarkMeasurement,
    BenchmarkMeasureOptions,
    BenchmarkOutputCallable,
    BenchmarkRuns
} from "~/types";

enum BenchmarkState {
    DISABLED = "disabled",
    ENABLED = "enabled",
    UNDETERMINED = "undetermined"
}

interface BenchmarkMeasurementStart
    extends Pick<BenchmarkMeasurement, "name" | "category" | "start"> {
    memoryStart: number;
}

const createDefaultOutputCallable = (): BenchmarkOutputCallable => {
    return async ({ benchmark }) => {
        console.log(`Benchmark total time elapsed: ${benchmark.elapsed}ms`);
        console.log("Benchmark measurements:");
        console.log(benchmark.measurements);
    };
};

export class Benchmark implements BenchmarkInterface {
    public readonly measurements: BenchmarkMeasurement[] = [];

    private outputDone = false;
    private isAlreadyRunning = false;
    private totalElapsed = 0;
    public readonly runs: BenchmarkRuns = {};
    private readonly enableOnCallables: BenchmarkEnableOnCallable[] = [];
    private readonly onOutputCallables: BenchmarkOutputCallable[] = [];
    private state: BenchmarkState = BenchmarkState.UNDETERMINED;

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
     * The last one is our built-in console.log output.
     */
    public async output(): Promise<void> {
        /**
         * No point in outputting more than once or if no measurements were made.
         */
        if (this.outputDone || this.measurements.length === 0) {
            return;
        }
        const callables = [...this.onOutputCallables].reverse();
        callables.push(createDefaultOutputCallable());
        for (const cb of callables) {
            const result = await cb({
                benchmark: this,
                stop: () => "stop"
            });
            if (result === "stop") {
                return;
            }
        }
        this.outputDone = true;
    }

    public async measure<T = any>(
        options: BenchmarkMeasureOptions | string,
        cb: () => Promise<T>
    ): Promise<T> {
        const enabled = await this.getIsEnabled();
        if (!enabled) {
            return cb();
        }
        const measurement = this.startMeasurement(options);
        const isAlreadyRunning = this.getIsAlreadyRunning();
        this.startRunning();
        try {
            return await cb();
        } finally {
            const measurementEnded = this.stopMeasurement(measurement);
            this.measurements.push(measurementEnded);
            this.addRun(measurementEnded);
            /**
             * Only add to total time if this run is not a child of another run.
             * And then end running.
             */
            if (!isAlreadyRunning) {
                this.addElapsed(measurementEnded);
                this.endRunning();
            }
        }
    }

    private getIsAlreadyRunning(): boolean {
        return this.isAlreadyRunning;
    }
    private startRunning(): void {
        this.isAlreadyRunning = true;
    }
    private endRunning(): void {
        this.isAlreadyRunning = false;
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

    private addElapsed(measurement: Pick<BenchmarkMeasurement, "elapsed">): void {
        this.totalElapsed = this.totalElapsed + measurement.elapsed;
    }

    private addRun(measurement: Pick<BenchmarkMeasurement, "name" | "category">): void {
        const name = `${measurement.category}#${measurement.name}`;
        if (!this.runs[name]) {
            this.runs[name] = 0;
        }
        this.runs[name]++;
    }

    private setState(state: BenchmarkState): void {
        this.state = state;
    }

    private startMeasurement(options: BenchmarkMeasureOptions | string): BenchmarkMeasurementStart {
        const name = typeof options === "string" ? options : options.name;
        const category = typeof options === "string" ? "webiny" : options.category;
        return {
            name,
            category,
            start: new Date(),
            memoryStart: process.memoryUsage().heapUsed
        };
    }

    private stopMeasurement(measurement: BenchmarkMeasurementStart): BenchmarkMeasurement {
        const end = new Date();
        const memoryEnd = process.memoryUsage().heapUsed;
        const elapsed = end.getTime() - measurement.start.getTime();
        return {
            name: measurement.name,
            category: measurement.category,
            start: measurement.start,
            end,
            elapsed,
            memory: memoryEnd - measurement.memoryStart
        };
    }
}
