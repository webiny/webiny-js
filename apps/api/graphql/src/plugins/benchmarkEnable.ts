import { ContextPlugin } from "@webiny/handler-aws";

export const createBenchmarkEnablePlugin = () => {
    const plugin = new ContextPlugin(async context => {
        context.benchmark.enableOn(async () => {
            if (process.env.BENCHMARK_ENABLE === "true") {
                return true;
            }

            return context.request.headers["x-benchmark"] === "true";
        });
    });
    plugin.name = "api.graphql.benchmark.enable";
    return plugin;
};
