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
        const PULUMI_SECRETS_PROVIDER = process.env["PULUMI_SECRETS_PROVIDER"];

        // Use ";" when on Windows. For Mac and Linux, use ":".
        const PATH_SEPARATOR = os.platform() === "win32" ? ";" : ":";

        const relativePath = path.relative(args.projectDir, args.appDir);
        const pulumiWorkDir = getPulumiWorkDir(args.projectDir, relativePath);

        if (!fs.existsSync(pulumiWorkDir)) {
            fs.mkdirSync(pulumiWorkDir, { recursive: true });
        }

        const stack = await LocalWorkspace.createOrSelectStack(
            {
                projectName: this.config.name,
                stackName: args.env,
                program: async () => {
                    const app = this.config.app({
                        env: args.env
                    });

                    return await app.run();
                }
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

        type SharedOptions = Pick<UpOptions, "onOutput" | "color">;
        const options: SharedOptions = {
            onOutput: line => console.log(trimNewlines(line)),
            color: "always"
        };

        return {
            async refresh() {
                await stack.refresh(options);
            },
            async preview() {
                await stack.preview(options);
            },
            async up() {
                await stack.up(options);
            }
        };
    }
}

export function createGenericApplication(config: ApplicationGenericConfig) {
    return new ApplicationBuilderGeneric(config);
}
