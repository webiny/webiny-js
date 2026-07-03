export interface CliOptions {
    ci: boolean;
    workspacesOnly: boolean;
    nodeModulesOnly: boolean;
}

export function parseArgs(argv: string[]): CliOptions {
    const flags = new Set(argv.slice(2));

    return {
        ci: flags.has("--ci"),
        workspacesOnly: flags.has("--workspacesOnly"),
        nodeModulesOnly: flags.has("--nodeModulesOnly")
    };
}
