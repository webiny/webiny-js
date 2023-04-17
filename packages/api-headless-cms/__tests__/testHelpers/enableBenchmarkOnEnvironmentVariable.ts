import { ContextPlugin } from "@webiny/api";

export const enableBenchmarkOnEnvironmentVariable = () => {
    return new ContextPlugin(async context => {
        context.benchmark.enableOn(async () => {
            return process.env.BENCHMARK_ENABLE === "true";
        });
    });
};
