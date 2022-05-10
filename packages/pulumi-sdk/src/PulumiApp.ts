import * as pulumi from "@pulumi/pulumi";

import { ApplicationContext } from "./ApplicationConfig";
import { ResourceArgs, ResourceConstructor, ResourceType } from "./PulumiResource";
import { tagResources } from "./utils/tagResources";

export interface CreateResourceParams<TCtor extends ResourceConstructor> {
    name: string;
    config: ResourceArgs<TCtor>;
    opts?: pulumi.CustomResourceOptions;
}

export interface PulumiAppResource<T extends ResourceConstructor> {
    name: string;
    readonly config: ResourceConfigProxy<ResourceArgs<T>>;
    readonly opts: pulumi.CustomResourceOptions;
    readonly output: pulumi.Output<pulumi.Unwrap<ResourceType<T>>>;
}

export interface PulumiAppParams {
    name: string;
    ctx: ApplicationContext;
}

export interface ResourceHandler {
    (resource: PulumiAppResource<ResourceConstructor>): void;
}

export type ResourceConfigProxy<T extends object> = {
    readonly [K in keyof T]-?: ResourceConfigSetter<T[K]>;
};

export interface ResourceConfigSetter<T> {
    (value: T): void;
    (fcn: ResourceConfigModifier<T>): void;
}

export interface ResourceConfigModifier<T> {
    (value: pulumi.Unwrap<T>): T | void;
}

interface DeployEventParams {
    outputs: Record<string, any>;
}

interface DeployEventHandler {
    (params: DeployEventParams): Promise<void> | void;
}

export abstract class PulumiApp<TConfig = unknown> {
    public readonly name: string;
    public readonly ctx: ApplicationContext;
    private readonly resourceHandlers: ResourceHandler[] = [];
    private readonly afterDeployHandlers: DeployEventHandler[] = [];
    private readonly handlers: (() => void | Promise<void>)[] = [];
    private readonly outputs: Record<string, any> = {};
    private readonly modules = new Map<symbol, unknown>();

    constructor(params: PulumiAppParams) {
        this.name = params.name;
        this.ctx = params.ctx;
    }

    public abstract setup(config: TConfig): Promise<void> | void;

    public onResource(handler: ResourceHandler): void {
        this.resourceHandlers.push(handler);
    }

    public onAfterDeploy(handler: DeployEventHandler) {
        this.afterDeployHandlers.push(handler);
    }

    public addResource<T extends ResourceConstructor>(ctor: T, params: CreateResourceParams<T>) {
        const config = params.config ?? ({} as ResourceArgs<T>);
        const opts = params.opts ?? {};

        const promise = new Promise<ResourceType<T>>(resolve => {
            this.handlers.push(() => {
                this.resourceHandlers.forEach(handler => handler(resourceInstance));
                const resourceInstance = new ctor(resource.name, config, opts);
                resolve(resourceInstance);
            });
        });

        const resource: PulumiAppResource<T> = {
            name: params.name,
            config: createConfigProxy(config),
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
        const module = def.run(this, config as TConfig);
        this.modules.set(def.symbol, module);

        return module;
    }

    public addHandler<T>(handler: () => Promise<T> | T) {
        const promise = new Promise<T>(resolve => {
            this.handlers.push(async () => {
                resolve(await handler());
            });
        });

        return pulumi.output(promise);
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

    public createController() {
        return {
            run: this.runProgram.bind(this),
            deployFinished: this.deployFinished.bind(this)
        };
    }

    private async runProgram() {
        tagResources({
            WbyProjectName: String(process.env["WEBINY_PROJECT_NAME"]),
            WbyEnvironment: String(process.env["WEBINY_ENV"])
        });

        for (const handler of this.handlers) {
            await handler();
        }

        return this.outputs;
    }

    private async deployFinished(params: DeployEventParams) {
        for (const handler of this.afterDeployHandlers) {
            await handler(params);
        }
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
    config(app: PulumiApp, config: TConfig): TOutput | Promise<TOutput>;
}

export function defineApp<TOutput extends Record<string, unknown>, TConfig = void>(
    params: CreateAppParams<TOutput, TConfig>
) {
    const appDef = class App extends PulumiApp<TConfig> {
        constructor(ctx: ApplicationContext) {
            super({ name: params.name, ctx: ctx });
        }

        public async setup(config: TConfig) {
            const output = await params.config(this, config);
            Object.assign(this, output);
        }
    };

    return appDef as new (ctx: ApplicationContext) => PulumiApp<TConfig> & TOutput;
}

function createConfigProxy<T extends object>(obj: T) {
    return new Proxy(obj, {
        get(target, p: string) {
            type V = T[keyof T];
            const key = p as keyof T;
            const setter: ResourceConfigSetter<V> = (value: V | ResourceConfigModifier<V>) => {
                if (typeof value === "function") {
                    const modifier = value as ResourceConfigModifier<V>;
                    const currentValue = target[key];
                    // Wrap a current config with a function.
                    const newValue = pulumi.output(currentValue).apply(v => {
                        const newValue = modifier(v);
                        return pulumi.output(newValue);
                    });

                    target[key] = newValue as unknown as V;
                } else {
                    target[key] = value;
                }
            };

            return setter;
        }
    }) as ResourceConfigProxy<T>;
}
