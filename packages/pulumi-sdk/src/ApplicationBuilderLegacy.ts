import { ApplicationBuilder, ApplicationStack, ApplicationStackArgs } from "./ApplicationBuilder";

export class ApplicationBuilderLegacy extends ApplicationBuilder {
    public async createOrSelectStack(args: ApplicationStackArgs): Promise<ApplicationStack> {
        const PULUMI_SECRETS_PROVIDER = String(process.env["PULUMI_SECRETS_PROVIDER"]);
        const PULUMI_CONFIG_PASSPHRASE = String(process.env["PULUMI_CONFIG_PASSPHRASE"]);
        const DEBUG = args.debug ?? false;

        await args.pulumi.run({
            command: ["stack", "select", args.env],
            args: {
                create: true,
                secretsProvider: PULUMI_SECRETS_PROVIDER
            },
            execa: {
                env: {
                    PULUMI_CONFIG_PASSPHRASE
                }
            }
        });

        return {
            refresh: async () => {
                await args.pulumi.run({
                    command: "refresh",
                    args: {
                        debug: DEBUG
                    },
                    execa: {
                        stdio: "inherit",
                        env: {
                            WEBINY_ENV: args.env,
                            WEBINY_PROJECT_NAME: this.config.name,
                            PULUMI_CONFIG_PASSPHRASE
                        }
                    }
                });

                return undefined;
            },
            preview: async () => {
                await args.pulumi.run({
                    command: "preview",
                    args: {
                        debug: DEBUG
                        // Preview command does not accept "--secrets-provider" argument.
                        // secretsProvider: PULUMI_SECRETS_PROVIDER
                    },
                    execa: {
                        stdio: "inherit",
                        env: {
                            WEBINY_ENV: args.env,
                            WEBINY_PROJECT_NAME: this.config.name,
                            PULUMI_CONFIG_PASSPHRASE
                        }
                    }
                });

                return undefined;
            },
            up: async () => {
                await args.pulumi.run({
                    command: "up",
                    args: {
                        yes: true,
                        skipPreview: true,
                        secretsProvider: PULUMI_SECRETS_PROVIDER,
                        debug: DEBUG
                    },
                    execa: {
                        // We pipe "stderr" so that we can intercept potential received error messages,
                        // and hopefully, show extra information / help to the user.
                        stdio: ["inherit", "inherit", "pipe"],
                        env: {
                            WEBINY_ENV: args.env,
                            WEBINY_PROJECT_NAME: this.config.name,
                            PULUMI_CONFIG_PASSPHRASE
                        }
                    }
                });

                return undefined;
            }
        };
    }
}
