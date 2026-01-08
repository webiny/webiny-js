import { createImplementation } from "@webiny/di";
import { CliCommand, GetProjectSdkService, UiService } from "~/abstractions/index.js";
import { IBaseAppParams } from "~/abstractions/features/types.js";
import { createBaseAppOptions } from "~/features/common/index.js";

export interface IOutputCommandParams extends IBaseAppParams {
    json?: boolean;
}

export class OutputCommand implements CliCommand.Interface<IOutputCommandParams> {
    constructor(
        private getProjectSdkService: GetProjectSdkService.Interface,
        private uiService: UiService.Interface
    ) {}

    async execute(): Promise<CliCommand.CommandDefinition<IOutputCommandParams>> {
        const projectSdk = await this.getProjectSdkService.execute();

        return {
            name: "output",
            description: "Prints Pulumi stack output for given project application and environment",
            params: [
                {
                    name: "app",
                    description: "Name of the app (core, admin, or api)",
                    type: "string",
                    required: true
                }
            ],
            options: [
                ...createBaseAppOptions(projectSdk, {
                    variant: {
                        description: "Variant of the app to watch"
                    }
                }),
                {
                    name: "json",
                    description: "Emit output as JSON",
                    type: "boolean"
                }
            ],
            handler: async (params: IOutputCommandParams) => {
                const projectSdk = await this.getProjectSdkService.execute();
                const ui = this.uiService;

                const output = await projectSdk.getAppStackOutput(params.app);
                if (params.json) {
                    ui.text(JSON.stringify(output, null, 2));
                    return;
                }

                // Nice indentation for console output.
                if (!output || Object.keys(output).length === 0) {
                    ui.text("No output values found.");
                    return;
                }

                // Format and display output
                const formatValue = (value: any, indent: number = 0): string[] => {
                    const lines: string[] = [];
                    const indentStr = "  ".repeat(indent);

                    if (value === null || value === undefined) {
                        return [indentStr + "(empty)"];
                    }

                    if (typeof value === "object" && !Array.isArray(value)) {
                        for (const [key, val] of Object.entries(value)) {
                            if (typeof val === "object" && val !== null && !Array.isArray(val)) {
                                lines.push(indentStr + `${key}:`);
                                lines.push(...formatValue(val, indent + 1));
                            } else {
                                lines.push(indentStr + `${key}: ${JSON.stringify(val)}`);
                            }
                        }
                    } else {
                        lines.push(indentStr + JSON.stringify(value));
                    }

                    return lines;
                };

                const lines: string[] = [];
                for (const [key, value] of Object.entries(output)) {
                    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
                        lines.push(`${key}:`);
                        lines.push(...formatValue(value, 1));
                    } else {
                        lines.push(`${key}: ${JSON.stringify(value)}`);
                    }
                }

                ui.text(lines.join("\n"));
            }
        };
    }
}

export const outputCommand = createImplementation({
    abstraction: CliCommand,
    implementation: OutputCommand,
    dependencies: [GetProjectSdkService, UiService]
});
