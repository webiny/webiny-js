import { CliCommandFactory } from "@webiny/cli-core/exports/cli/command.js";
import { Ui } from "@webiny/cli-core/exports/cli/index.js";

export interface IInitAgentParams {
    agent: string;
    instructions: boolean;
}

const SUPPORTED = ["claude", "cursor", "windsurf", "copilot", "cline", "opencode"];

class ConfigureMcp implements CliCommandFactory.Interface<IInitAgentParams> {
    constructor(private ui: Ui.Interface) {}

    execute(): CliCommandFactory.CommandDefinition<IInitAgentParams> {
        return {
            name: "configure-mcp",
            description: "Configure MCP server for a specific agent.",
            examples: [
                "$0 configure-mcp claude",
                "$0 configure-mcp cursor",
                "$0 configure-mcp --instructions"
            ],
            params: [
                {
                    name: "agent",
                    description: "Agent name (claude, cursor, windsurf, copilot, cline, opencode)",
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
                    this.ui.error(`Unknown agent "${target}".`);
                    this.ui.text(`Supported: ${SUPPORTED.join(", ")}`);
                    this.ui.text("For other agents, run: npx webiny configure-mcp --instructions");
                    process.exit(1);
                }

                const cwd = process.cwd();
                const { init } = await import(`../agents/${target}.js`);
                await init({ ui: this.ui, cwd });
            }
        };
    }
}

export default CliCommandFactory.createImplementation({
    implementation: ConfigureMcp,
    dependencies: [Ui]
});
