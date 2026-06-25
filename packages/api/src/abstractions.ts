import { createAbstraction } from "@webiny/feature/api";
import type { Benchmark as BenchmarkInterface } from "./types.js";

export const BenchmarkAbstraction = createAbstraction<BenchmarkInterface>("Benchmark");
export namespace BenchmarkAbstraction {
    export type Interface = BenchmarkInterface;
}
