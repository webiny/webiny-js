import { Benchmark as BenchmarkInterface, BenchmarkMeasurement, BenchmarkRuns } from "~/types";

export class Benchmark implements BenchmarkInterface {
    public readonly measurements: BenchmarkMeasurement[] = [];

    private totalElapsed = 0;
    public readonly runs: BenchmarkRuns = {};

    private enabled = false;

    public get elapsed(): number {
        return this.totalElapsed;
    }

    public enable(): void {
        this.enabled = true;
    }

    public disable(): void {
        this.enabled = false;
    }

    public async measure<T = any>(name: string, cb: () => Promise<T>): Promise<T> {
        if (!this.enabled) {
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
