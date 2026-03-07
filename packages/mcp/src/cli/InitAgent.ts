import { CliCommandFactory } from "@webiny/cli-core/exports/cli/command.js";

export interface IInitAgentParams {
    agent: string;
    instructions: boolean;
}

const SUPPORTED = ["claude", "cursor", "windsurf", "copilot"];

class McpInitAgent implements CliCommandFactory.Interface<IInitAgentParams> {
    execute(): CliCommandFactory.CommandDefinition<IInitAgentParams> {
        return {
            name: "init-agent",
            description: "Configure MCP server for a specific agent.",
            examples: ["$0 init-agent claude", "$0 init-agent --instructions"],
            params: [
                {
                    name: "agent",
                    description: "Agent name (claude, copilot, cursor, ...)",
                    type: "string",
                    default: "claude"
                }
            ],
            options: [
                {
                    name: "instructions",
                    description: "Print MCP setup instructions",
                    type: "boolean",
                    default: false
                }
            ],
            handler: async params => {
                if (params.instructions) {
                    const { printInstructions } = await import("../agents/instructions.js");
                    printInstructions();
                    return;
                }

                const target = params.agent || "claude";

                if (!SUPPORTED.includes(target)) {
                    console.error(`[webiny] Unknown agent "${target}".`);
                    console.error(`         Supported: ${SUPPORTED.join(", ")}`);
                    console.error(
                        `         For other agents run: npx webiny init-agent --instructions`
                    );
                    process.exit(1);
                }

                const cwd = process.cwd();
                const { init } = await import(`../agents/${target}.js`);
                await init({ cwd });
            }
        };
    }
}

export default CliCommandFactory.createImplementation({
    implementation: McpInitAgent,
    dependencies: []
});
