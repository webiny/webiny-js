import { createAbstraction } from "@webiny/feature/api";
import type { Benchmark as BenchmarkInterface } from "./types.js";
import type { PluginsContainer as PluginsContainerType } from "@webiny/plugins";

export const BenchmarkAbstraction = createAbstraction<BenchmarkInterface>("Benchmark");
export namespace BenchmarkAbstraction {
    export type Interface = BenchmarkInterface;
}

export const PluginsContainerAbstraction =
    createAbstraction<PluginsContainerType>("PluginsContainer");
export namespace PluginsContainerAbstraction {
    export type Interface = PluginsContainerType;
}
