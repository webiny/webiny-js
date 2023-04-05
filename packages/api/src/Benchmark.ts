import { Benchmark as BenchmarkInterface, BenchmarkMeasurement } from "~/types";

export class Benchmark implements BenchmarkInterface {
    public readonly measurements: BenchmarkMeasurement[] = [];

    private enabled = false;

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
            this.measurements.push({
                name,
                start,
                end,
                elapsed: end.getTime() - start.getTime(),
                memory: memoryEnd - memoryStart
            });
        }
    }
}
