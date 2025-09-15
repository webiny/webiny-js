import { createImplementation } from "@webiny/di-container";
import { Command, GetProjectSdkService } from "~/abstractions/index.js";

export class InfoCommand implements Command.Interface<void> {
    constructor(private getProjectSdkService: GetProjectSdkService.Interface) {}

    execute(): Command.CommandDefinition<void> {
        return {
            name: "info",
            description: "Lists relevant URLs for your Webiny project",
            options: [
                {
                    name: "env",
                    description: `Environment (required if Pulumi state files are not stored locally)`,
                    type: "string"
                },
                {
                    name: "debug",
                    description: "Debug",
                    type: "string"
                }
            ],

            handler: async () => {
                console.log("TODO!");
            }
        };
    }
}

export const infoCommand = createImplementation({
    abstraction: Command,
    implementation: InfoCommand,
    dependencies: [GetProjectSdkService]
});
