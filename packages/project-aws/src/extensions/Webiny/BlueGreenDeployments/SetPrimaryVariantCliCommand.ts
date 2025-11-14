import { createImplementation } from "@webiny/di";
import { Command, GetProjectSdkService } from "@webiny/cli-core/abstractions/index.js";

export interface ISetPrimaryVariantCommandParams {
    env: string;
    confirm?: boolean;
    primary: string;
    secondary: string;
}

/**
 * Command to set a primary variant does not require a region because it is already contained inside the stack output.
 */
export class SetPrimaryVariantCommandImpl
    implements Command.Interface<ISetPrimaryVariantCommandParams>
{
    constructor(private getProjectSdkService: GetProjectSdkService.Interface) {}

    async execute(): Promise<Command.CommandDefinition<ISetPrimaryVariantCommandParams>> {
        const projectSdk = await this.getProjectSdkService.execute();

        return {
            name: "set-variant",
            description: "Set a deployed system as primary variant.",
            examples: [
                "$0 set-variant --env=dev --primary=blue --secondary=green",
                "$0 set-variant --env=dev --primary=green --secondary=green"
            ],
            options: [
                {
                    name: "env",
                    description: "Environment name (dev, prod, etc.)",
                    type: "string"
                },
                {
                    name: "confirm",
                    description: "Confirm deployment",
                    type: "boolean",
                    required: false
                },
                {
                    name: "primary",
                    description: "Primary variant",
                    type: "string",
                    required: true,
                    validation: params => {
                        const isValid = projectSdk.isValidVariantName(params.primary);
                        if (isValid.isErr()) {
                            throw isValid.error;
                        }
                        return true;
                    }
                },
                {
                    name: "secondary",
                    description: "Secondary variant",
                    type: "string",
                    required: true,
                    validation: params => {
                        const isValid = projectSdk.isValidVariantName(params.secondary);
                        if (isValid.isErr()) {
                            throw isValid.error;
                        }
                        return true;
                    }
                }
            ],
            handler: async () => {
                // TODO: Finish this.
            }
        };
    }
}

export const SetPrimaryVariantCliCommand = Command.createImplementation({
    implementation: SetPrimaryVariantCommandImpl,
    dependencies: [GetProjectSdkService]
});
