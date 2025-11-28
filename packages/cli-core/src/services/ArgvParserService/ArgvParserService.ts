import { createImplementation } from "@webiny/di";
import { ArgvParserService, type ParsedArgv, type GlobalArgv } from "~/abstractions/index.js";
import yargs from "yargs";

export class DefaultArgvParserService implements ArgvParserService.Interface {
    parse<T = Record<string, any>>(argv: string[]): ParsedArgv<T> {
        const parsed = yargs(argv)
            .option("show-logs", {
                type: "boolean",
                default: false,
                desc: "Print logs directly in the terminal"
            })
            .option("log-level", {
                type: "string",
                default: "info",
                choices: ["silent", "fatal", "error", "warn", "info", "debug", "trace"],
                desc: "Set the verbosity of logs"
            })
            .option("stack-trace", {
                type: "boolean",
                default: false,
                desc: "Show stack traces for errors"
            })
            .help(false)
            .version(false)
            .parseSync();

        return {
            showLogs: parsed["show-logs"] as boolean,
            logLevel: parsed["log-level"] as GlobalArgv["logLevel"],
            stackTrace: parsed["stack-trace"] as boolean,
            ...parsed
        } as ParsedArgv<T>;
    }
}

export const argvParserService = createImplementation({
    abstraction: ArgvParserService,
    implementation: DefaultArgvParserService,
    dependencies: []
});

