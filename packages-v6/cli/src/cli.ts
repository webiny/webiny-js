import * as yargs from "yargs";
import type { MiddlewareFunction, Options } from "yargs";
import { Webiny } from "@webiny/core";

interface ParsedOptions {
    // Even though `debug` has a default value, and will always be present, we have to mark it as optional
    // because the `.middleware()` function doesn't accept a generic type and will complain about any required parameter.
    debug?: boolean;
    env?: string;
}

export const runCli = () => {
    let webiny: Webiny;

    // `yargs` middleware allows us to setup Webiny based on the parsed CLI arguments.
    const setupContext: MiddlewareFunction<ParsedOptions> = async args => {
        if (args._.includes("build") && args._.includes("package")) {
            return;
        }

        const { initializeWebiny } = await import("@webiny/core");
        webiny = await initializeWebiny({ debug: args.debug || false, env: args.env });
    };

    const envOption: Record<string, Options> = { env: { type: "string", required: true } };
    const watchOption: Record<string, Options> = { watch: { type: "boolean", default: false } };

    return yargs
        .scriptName("webiny")
        .usage("$0 <cmd> [args]")
        .middleware(setupContext)
        .option("debug", {
            default: false,
            global: true,
            type: "boolean"
        })
        .command("watch admin", "Watch admin app", {}, async () => {
            return webiny.buildAdmin({ watch: true });
        })
        .command("build", "Build [package|api|admin|website]", yargs => {
            yargs.command("package", "Build a package", {}, async () => {
                const { buildPackage } = await import("./buildPackage");
                await buildPackage({ directory: process.cwd() });
            });

            yargs.command("admin", "Build the admin app", {}, async () => {
                return webiny.buildAdmin({ watch: false });
            });

            yargs.command(
                "api",
                "Build API",
                { ...envOption, ...watchOption },
                async ({ watch }) => {
                    return webiny.buildApi({ watch: Boolean(watch) });
                }
            );
        })
        .command(
            "deploy-api",
            "Deploy API",
            { ...envOption, preview: { type: "boolean", default: false } },
            () => {
                console.log("Deploy API");
                // import("@webiny/deploy").then(m => m.default({ preview: args.preview }));
            }
        )
        .help()
        .parse();
};
