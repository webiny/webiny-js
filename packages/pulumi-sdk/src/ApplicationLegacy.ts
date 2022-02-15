import { Pulumi } from "./Pulumi";
import { ApplicationConfig } from "./ApplicationConfig";

interface StackArgs {
    /** Root path of the application */
    appDir: string;
    /** Root dir of the project */
    projectDir: string;
    env: string;
    pulumi: Pulumi;
    debug?: boolean;
}

export class ApplicationLegacy implements Readonly<ApplicationConfig> {
    public readonly id: string;
    public readonly name: string;
    public readonly description?: string;
    public readonly cli?: Record<string, any>;

    constructor(config: ApplicationConfig) {
        this.id = config.id;
        this.name = config.name;
        this.description = config.description;
        this.cli = config.cli;
    }

    public async createOrSelectStack(args: StackArgs) {
        const PULUMI_SECRETS_PROVIDER = process.env.PULUMI_SECRETS_PROVIDER;
        const PULUMI_CONFIG_PASSPHRASE = process.env.PULUMI_CONFIG_PASSPHRASE;

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
                return await args.pulumi.run({
                    command: "refresh",
                    args: {
                        debug: args.debug
                    },
                    execa: {
                        stdio: "inherit",
                        env: {
                            WEBINY_ENV: args.env,
                            WEBINY_PROJECT_NAME: this.name,
                            PULUMI_CONFIG_PASSPHRASE
                        }
                    }
                });
            },
            preview: async () => {
                return await args.pulumi.run({
                    command: "preview",
                    args: {
                        debug: args.debug
                        // Preview command does not accept "--secrets-provider" argument.
                        // secretsProvider: PULUMI_SECRETS_PROVIDER
                    },
                    execa: {
                        stdio: "inherit",
                        env: {
                            WEBINY_ENV: args.env,
                            WEBINY_PROJECT_NAME: this.name,
                            PULUMI_CONFIG_PASSPHRASE
                        }
                    }
                });
            },
            up: async () => {
                return await args.pulumi.run({
                    command: "up",
                    args: {
                        yes: true,
                        skipPreview: true,
                        secretsProvider: PULUMI_SECRETS_PROVIDER,
                        debug: args.debug
                    },
                    execa: {
                        // We pipe "stderr" so that we can intercept potential received error messages,
                        // and hopefully, show extra information / help to the user.
                        stdio: ["inherit", "inherit", "pipe"],
                        env: {
                            WEBINY_ENV: args.env,
                            WEBINY_PROJECT_NAME: this.name,
                            PULUMI_CONFIG_PASSPHRASE
                        }
                    }
                });
            }
        };
    }
}
