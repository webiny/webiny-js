import { CliCommandFactory } from "@webiny/cli-core/exports/cli/command.js";
import { Ui } from "@webiny/cli-core/exports/cli.js";
import { configureMcp } from "@webiny/mcp";

interface IConfigureMcpCommandParams {
    agent: string;
    instructions: boolean;
}

class ConfigureMcpCommand implements CliCommandFactory.Interface<IConfigureMcpCommandParams> {
    constructor(private ui: Ui.Interface) {}

    execute(): CliCommandFactory.CommandDefinition<IConfigureMcpCommandParams> {
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
                await configureMcp({
                    agent: params.agent,
                    instructions: params.instructions,
                    ui: this.ui
                });
            }
        };
    }
}

export default CliCommandFactory.createImplementation({
    implementation: ConfigureMcpCommand,
    dependencies: [Ui]
});
