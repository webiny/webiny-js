import { startMcpServer } from "./cli/McpServer.js";
import { configureMcp } from "./cli/ConfigureMcp.js";

const args = process.argv.slice(2);
const command = args[0];

function parseFlags(args: string[]): Record<string, string | string[] | boolean> {
    const flags: Record<string, string | string[] | boolean> = {};
    for (const arg of args) {
        if (!arg.startsWith("--")) {
            continue;
        }
        const [key, ...rest] = arg.slice(2).split("=");
        const value = rest.length > 0 ? rest.join("=") : true;

        // Support repeated flags as arrays.
        const existing = flags[key];
        if (existing !== undefined) {
            flags[key] = Array.isArray(existing)
                ? [...existing, value as string]
                : [existing as string, value as string];
        } else {
            flags[key] = value;
        }
    }
    return flags;
}

async function main(): Promise<void> {
    if (command === "serve") {
        const flags = parseFlags(args.slice(1));
        const additionalSkills = flags["additional-skills"];
        await startMcpServer({
            skills: typeof flags.skills === "string" ? flags.skills : undefined,
            additionalSkills: Array.isArray(additionalSkills)
                ? additionalSkills
                : typeof additionalSkills === "string"
                  ? [additionalSkills]
                  : undefined
        });
    } else if (command === "configure") {
        const agent = args[1] && !args[1].startsWith("--") ? args[1] : undefined;
        const flags = parseFlags(args.slice(1));
        await configureMcp({
            agent,
            instructions: flags.instructions === true
        });
    } else {
        console.log("Usage: webiny-mcp <command>");
        console.log("");
        console.log("Commands:");
        console.log("  serve        Start the MCP server (stdio transport)");
        console.log("  configure    Configure MCP server for a specific agent");
        console.log("");
        console.log("Examples:");
        console.log("  npx webiny-mcp serve");
        console.log("  npx webiny-mcp serve --additional-skills=./my-skills");
        console.log("  npx webiny-mcp configure claude");
        console.log("  npx webiny-mcp configure cursor");
        console.log("  npx webiny-mcp configure --instructions");
        process.exit(command ? 1 : 0);
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
