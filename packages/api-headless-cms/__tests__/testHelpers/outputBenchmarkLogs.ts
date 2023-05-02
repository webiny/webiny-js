import pathPackage from "path";
import writeJson from "write-json-file";
import { ContextPlugin } from "@webiny/handler";

/**
 * Do not use in the CI!
 */
export const createOutputBenchmarkLogs = () => {
    return new ContextPlugin(async context => {
        context.benchmark.onOutput(async ({ benchmark, stop }) => {
            const target = pathPackage.join(
                __dirname,
                "../logs",
                `${new Date().toISOString()}.json`
            );
            writeJson.sync(
                target,
                {
                    elapsed: benchmark.elapsed,
                    measurements: benchmark.measurements
                },
                { indent: 4 }
            );
            return stop();
        });
    });
};
