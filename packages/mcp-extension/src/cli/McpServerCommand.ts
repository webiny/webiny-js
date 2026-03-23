import { CliCommandFactory } from "@webiny/cli-core/exports/cli/command.js";
import { startMcpServer } from "@webiny/mcp";

interface IMcpServerCommandParams {
    skills: string;
    "additional-skills": string[];
}

class McpServerCommand implements CliCommandFactory.Interface<IMcpServerCommandParams> {
    execute(): CliCommandFactory.CommandDefinition<IMcpServerCommandParams> {
        return {
            name: "mcp-server",
            description: "Start the Webiny MCP server (stdio transport).",
            examples: [
                "$0 mcp-server",
                "$0 mcp-server --skills=./my-skills",
                "$0 mcp-server --additional-skills=./extra-skills"
            ],
            options: [
                {
                    name: "skills",
                    description:
                        "Replace the built-in skills folder entirely. Only skills found in the given path will be served.",
                    type: "string"
                },
                {
                    name: "additional-skills",
                    description:
                        "Add a folder on top of the built-in (or --skills) folder. Can be repeated.",
                    type: "string",
                    array: true
                }
            ],
            handler: async params => {
                await startMcpServer({
                    skills: params.skills,
                    additionalSkills: params["additional-skills"]
                });
            }
        };
    }
}

export default CliCommandFactory.createImplementation({
    implementation: McpServerCommand,
    dependencies: []
});
