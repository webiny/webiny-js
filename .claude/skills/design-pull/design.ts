/**
 * Command-line entry for the design-pull and design-ask skills.
 * Run from the repository root: yarn tsx .claude/skills/design-pull/design.ts <command> ...
 * Exit codes: 0 success, 1 error, 2 unknown command; import-raw adds 2-5 (see lib.ts).
 */
import { parseArgs, type ParseArgsConfig } from "node:util";
import * as lib from "./lib.ts";

type Values = Record<string, string | boolean | undefined>;

interface Command {
    usage: string;
    options: NonNullable<ParseArgsConfig["options"]>;
    run: (positionals: string[], values: Values) => number | void;
}

const one = (positionals: string[], usage: string): string => {
    if (positionals.length !== 1) {
        throw new lib.DesignError(`usage: ${usage}`);
    }
    return positionals[0];
};

const required = (values: Values, name: string, usage: string): string => {
    const value = values[name];
    if (typeof value !== "string" || value === "") {
        throw new lib.DesignError(`--${name} is required; usage: ${usage}`);
    }
    return value;
};

const commands: Record<string, Command> = {
    init: {
        usage: "init <folder> --project <name> --project-id <uuid>",
        options: { project: { type: "string" }, "project-id": { type: "string" } },
        run: (positionals, values) =>
            lib.cmdInit(
                one(positionals, commands.init.usage),
                required(values, "project", commands.init.usage),
                required(values, "project-id", commands.init.usage)
            )
    },
    "list-folders": {
        usage: "list-folders",
        options: {},
        run: () => lib.cmdListFolders()
    },
    plan: {
        usage: "plan <folder> <listing> --out <plan.json>",
        options: { out: { type: "string" } },
        run: (positionals, values) => {
            if (positionals.length !== 2) {
                throw new lib.DesignError(`usage: ${commands.plan.usage}`);
            }
            lib.cmdPlan(positionals[0], positionals[1], required(values, "out", commands.plan.usage));
        }
    }
};

const main = (argv: string[]): number => {
    const [name, ...rest] = argv;
    const command = name ? commands[name] : undefined;
    if (!command) {
        process.stderr.write(`usage: design.ts <${Object.keys(commands).join("|")}> ...\n`);
        return 2;
    }
    try {
        const { values, positionals } = parseArgs({
            args: rest,
            options: command.options,
            allowPositionals: true,
            strict: true
        });
        return command.run(positionals, values as Values) ?? 0;
    } catch (error) {
        const code = (error as { code?: string }).code ?? "";
        if (error instanceof lib.DesignError || code.startsWith("ERR_PARSE_ARGS")) {
            process.stderr.write(`error: ${(error as Error).message}\n`);
            return 1;
        }
        throw error;
    }
};

process.exitCode = main(process.argv.slice(2));
