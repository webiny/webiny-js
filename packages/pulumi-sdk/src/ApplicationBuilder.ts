import { PreviewResult, RefreshResult, UpResult } from "@pulumi/pulumi/automation";
import { ApplicationHooks } from "./ApplicationConfig";
import { ApplicationHook } from "./ApplicationHook";
import { Pulumi } from "./Pulumi";
import { PulumiApp } from "./PulumiApp";

export interface ApplicationStackArgs {
    /** Root path of the application */
    appDir: string;
    /** Root dir of the project */
    projectDir: string;
    pulumi: Pulumi;
    debug?: boolean;
    env: string;
    variant?: string;
}

export interface ApplicationBuilderConfig extends Partial<ApplicationHooks> {
    id: string;
    name: string;
    description?: string;
    cli?: Record<string, any>;
}

export interface ApplicationStack {
    app?: PulumiApp;
    refresh(): Promise<RefreshResult | undefined>;
    preview(): Promise<PreviewResult | undefined>;
    up(): Promise<UpResult | undefined>;
}

export abstract class ApplicationBuilder<
    TConfig extends ApplicationBuilderConfig = ApplicationBuilderConfig
> implements ApplicationBuilderConfig
{
    // It needs to duplicate configuration props for backwards compatibility.
    // There is a lot of CLI code, that depends on it.
    public readonly id: string;
    public readonly name: string;
    public readonly description?: string;
    public readonly cli?: Record<string, any>;
    public readonly onBeforeBuild?: ApplicationHook;
    public readonly onAfterBuild?: ApplicationHook;
    public readonly onBeforeDeploy?: ApplicationHook;
    public readonly onAfterDeploy?: ApplicationHook;

    constructor(public readonly config: TConfig) {
        this.id = config.id;
        this.name = config.name;
        this.description = config.description;
        this.cli = config.cli;
        this.onBeforeBuild = config.onBeforeBuild;
        this.onAfterBuild = config.onAfterBuild;
        this.onBeforeDeploy = config.onBeforeDeploy;
        this.onAfterDeploy = config.onAfterDeploy;
    }

    public abstract createOrSelectStack(args: ApplicationStackArgs): Promise<ApplicationStack>;
}
