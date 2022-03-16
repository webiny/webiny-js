import os from "os";
import path from "path";
import fs from "fs";
import trimNewlines from "trim-newlines";
import { LocalWorkspace, UpOptions } from "@pulumi/pulumi/automation";

import { PulumiApp } from "./PulumiApp";
import { getPulumiWorkDir } from "./utils/getPulumiWorkDir";
import {
    ApplicationBuilder,
    ApplicationBuilderConfig,
    ApplicationStack,
    ApplicationStackArgs
} from "./ApplicationBuilder";
import { ApplicationContext } from "./ApplicationConfig";

export interface ApplicationGenericConfig extends ApplicationBuilderConfig {
    app(ctx: ApplicationContext): PulumiApp;
}

export class ApplicationBuilderGeneric extends ApplicationBuilder<ApplicationGenericConfig> {
    public async createOrSelectStack(args: ApplicationStackArgs): Promise<ApplicationStack> {
        const PULUMI_SECRETS_PROVIDER = process.env.PULUMI_SECRETS_PROVIDER;

        // Use ";" when on Windows. For Mac and Linux, use ":".
        const PATH_SEPARATOR = os.platform() === "win32" ? ";" : ":";

        const relativePath = path.relative(args.projectDir, args.appDir);
        const pulumiWorkDir = getPulumiWorkDir(args.projectDir, relativePath);

        if (!fs.existsSync(pulumiWorkDir)) {
            fs.mkdirSync(pulumiWorkDir, { recursive: true });
        }

        const app = this.config.app({
            env: args.env,
            variant: args.variant,
            appDir: args.appDir,
            projectDir: args.projectDir
        });

        const appController = app.createController();

        const stack = await LocalWorkspace.createOrSelectStack(
            {
                projectName: this.config.name,
                // TODO this makes sense only for API/Admin/Website, but not for storage/gateway
                // We should add additional logic around that.
                stackName: args.variant ? `${args.env}.${args.variant}` : args.env,
                program: () => appController.run()
            },
            {
                workDir: pulumiWorkDir,
                projectSettings: {
                    name: this.config.name,
                    runtime: "nodejs",
                    description: this.config.description
                },
                secretsProvider: PULUMI_SECRETS_PROVIDER,
                pulumiHome: args.pulumi.pulumiFolder,
                envVars: {
                    WEBINY_ENV: args.env,
                    WEBINY_PROJECT_NAME: this.config.name,
                    // Add Pulumi CLI path to env variable, so the CLI would be properly resolved.
                    PATH: args.pulumi.pulumiFolder + PATH_SEPARATOR + (process.env.PATH ?? "")
                }
            }
        );

        type SharedOptions = Pick<UpOptions, "onOutput" | "color" | "onEvent">;
        const options: SharedOptions = {
            onOutput: line => console.log(trimNewlines(line)),
            color: "always"
        };

        return {
            async refresh() {
                return await stack.refresh(options);
            },
            async preview() {
                return await stack.preview(options);
            },
            async up() {
                const result = await stack.up(options);

                const outputs: Record<string, any> = {};
                for (const key of Object.keys(result.outputs)) {
                    outputs[key] = result.outputs[key].value;
                }

                await appController.deployFinished({ outputs });
                return result;
            }
        };
    }
}

export function createGenericApplication(config: ApplicationGenericConfig) {
    return new ApplicationBuilderGeneric(config);
}
