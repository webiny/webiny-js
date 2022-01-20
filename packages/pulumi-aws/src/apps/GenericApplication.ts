import { PulumiFn, LocalWorkspace } from "@pulumi/pulumi/automation";
import { ApplicationConfig, ApplicationHook } from "./ApplicationConfig";

export interface GenericApplicationConfig extends ApplicationConfig {
    readonly pulumiProgram: PulumiFn;
}

interface StackArgs {
    /** Root path of the application */
    root: string;
    env: string;
    pulumiCli: string;
}

export class GenericApplication implements Readonly<ApplicationConfig> {
    public readonly id: string;
    public readonly name: string;
    public readonly description?: string;
    public readonly cli?: Record<string, any>;
    public readonly beforeBuild?: ApplicationHook;
    public readonly afterBuild?: ApplicationHook;
    public readonly beforeDeploy?: ApplicationHook;
    public readonly afterDeploy?: ApplicationHook;

    constructor(private readonly config: GenericApplicationConfig) {
        this.id = config.id;
        this.name = config.name;
        this.description = config.description;
        this.cli = config.cli;
        this.beforeBuild = config.beforeBuild;
        this.afterBuild = config.afterBuild;
        this.beforeDeploy = config.beforeDeploy;
        this.afterDeploy = config.afterDeploy;
    }

    public async createOrSelectStack(args: StackArgs) {
        const PULUMI_SECRETS_PROVIDER = process.env.PULUMI_SECRETS_PROVIDER;
        // const PULUMI_CONFIG_PASSPHRASE = process.env.PULUMI_CONFIG_PASSPHRASE;

        return await LocalWorkspace.createOrSelectStack(
            {
                projectName: this.config.name,
                stackName: args.env,
                program: this.config.pulumiProgram
            },
            {
                workDir: args.root,
                projectSettings: {
                    name: this.config.name,
                    runtime: "nodejs",
                    description: this.config.description
                },
                secretsProvider: PULUMI_SECRETS_PROVIDER,
                envVars: process.env,
                pulumiHome: args.pulumiCli
            }
        );
    }
}

export function createGenericApplication(config: GenericApplicationConfig) {
    return new GenericApplication(config);
}
