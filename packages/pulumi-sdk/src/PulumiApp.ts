import * as pulumi from "@pulumi/pulumi";

import { ApplicationContext } from "./ApplicationBuilder";
import { ResourceArgs, ResourceConstructor, ResourceType } from "./PulumiResource";
import { tagResources } from "./utils/tagResources";

export interface CreateResourceParams<TCtor extends ResourceConstructor> {
    name: string;
    config: ResourceArgs<TCtor>;
    opts?: pulumi.CustomResourceOptions;
}

export interface PulumiAppResource<T extends ResourceConstructor> {
    readonly config: ResourceArgs<T>;
    readonly opts: pulumi.CustomResourceOptions;
    readonly output: pulumi.Output<pulumi.Unwrap<ResourceType<T>>>;
}

export interface PulumiAppParams {
    name: string;
    ctx: ApplicationContext;
}

export class PulumiApp {
    public readonly name: string;
    public readonly ctx: ApplicationContext;
    private readonly handlers: (() => void | Promise<void>)[] = [];
    private readonly outputs: Record<string, any> = {};
    private readonly modules = new Map<symbol, unknown>();

    constructor(params: PulumiAppParams) {
        this.name = params.name;
        this.ctx = params.ctx;
    }

    public addResource<T extends ResourceConstructor>(ctor: T, params: CreateResourceParams<T>) {
        const config = params.config ?? ({} as ResourceArgs<T>);
        const opts = params.opts ?? {};

        const promise = new Promise<ResourceType<T>>(resolve => {
            this.handlers.push(() => {
                const resource = new ctor(params.name, params.config, params.opts);
                resolve(resource);
            });
        });

        const resource: PulumiAppResource<T> = {
            config,
            opts,
            output: pulumi.output(promise)
        };

        return resource;
    }

    public addOutput<T>(name: string, output: T) {
        this.outputs[name] = output;
    }

    public addOutputs(outputs: Record<string, unknown>) {
        Object.assign(this.outputs, outputs);
    }

    public addModule<TModule>(def: PulumiAppModuleDefinition<TModule, void>): TModule;
    public addModule<TModule, TConfig>(
        def: PulumiAppModuleDefinition<TModule, TConfig>,
        config: TConfig
    ): TModule;
    public addModule<TModule, TConfig>(
        def: PulumiAppModuleDefinition<TModule, TConfig>,
        config?: TConfig
    ) {
        const module = def.run(this, config);
        this.modules.set(def.symbol, module);

        return module;
    }

    public addHandler(handler: () => Promise<void> | void) {
        this.handlers.push(handler);
    }

    public getModule<TConfig, TModule>(def: PulumiAppModuleDefinition<TModule, TConfig>): TModule;
    public getModule<TConfig, TModule>(
        def: PulumiAppModuleDefinition<TModule, TConfig>,
        opts: { optional: false }
    ): TModule;
    public getModule<TConfig, TModule>(
        def: PulumiAppModuleDefinition<TModule, TConfig>,
        opts: { optional: true }
    ): TModule | null;
    public getModule<TConfig, TModule>(
        def: PulumiAppModuleDefinition<TModule, TConfig>,
        opts?: { optional: boolean }
    ) {
        const module = this.modules.get(def.symbol);

        if (!module) {
            if (opts?.optional) {
                return null;
            } else {
                throw new Error(`Module "${def.name}" not found in "${this.name}" app`);
            }
        }

        return module;
    }

    public async run() {
        tagResources({
            WbyProjectName: String(process.env.WEBINY_PROJECT_NAME),
            WbyEnvironment: String(process.env.WEBINY_ENV)
        });

        // TODO: run concurrently?
        for (const handler of this.handlers) {
            await handler();
        }

        return this.outputs;
    }
}

export interface PulumiAppModuleCallback<TModule, TConfig> {
    (this: void, app: PulumiApp, config: TConfig): TModule;
}

export interface PulumiAppModuleParams<TModule, TConfig> {
    name: string;
    config: PulumiAppModuleCallback<TModule, TConfig>;
}

export class PulumiAppModuleDefinition<TModule, TConfig> {
    public readonly symbol = Symbol();
    public readonly name: string;
    public readonly run: PulumiAppModuleCallback<TModule, TConfig>;
    constructor(params: PulumiAppModuleParams<TModule, TConfig>) {
        this.name = params.name;
        this.run = params.config;
    }
}

export function defineAppModule<TModule, TConfig = void>(
    params: PulumiAppModuleParams<TModule, TConfig>
) {
    return new PulumiAppModuleDefinition(params);
}

export interface CreateAppParams<TOutput extends Record<string, unknown>, TConfig = void> {
    name: string;
    config(app: PulumiApp, config: TConfig): TOutput;
}

export function defineApp<TOutput extends Record<string, unknown>, TConfig = void>(
    params: CreateAppParams<TOutput, TConfig>
) {
    const appDef = class App extends PulumiApp {
        constructor(ctx: ApplicationContext, config: TConfig) {
            super({ name: params.name, ctx: ctx });
            const output = params.config(this, config);
            Object.assign(this, output);
        }
    };

    return appDef as new (ctx: ApplicationContext, config: TConfig) => PulumiApp & TOutput;
}
