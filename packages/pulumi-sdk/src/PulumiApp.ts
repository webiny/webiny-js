import * as pulumi from "@pulumi/pulumi";

import { ApplicationContext } from "./ApplicationConfig";
import { PulumiAppModuleDefinition } from "./PulumiAppModule";
import { ResourceArgs, ResourceConstructor, ResourceType } from "./PulumiResource";
import { tagResources } from "./utils";

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

    /**
     * Adds a resource to pulumi app.
     * It's not running the script immadietely, but enqueues the call.
     * This way we are still able to modify the config of the resource.
     * @param ctor Resource to be added, ie aws.s3.Bucket
     * @param params Parameters to configure the resource
     * @returns Object giving access to both resource outputs and its config.
     */
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

    /**
     * Registers output value within pulumi app.
     * @param name Name of the output value
     * @param output Value of the output
     */
    public addOutput<T>(name: string, output: T) {
        this.outputs[name] = output;
    }

    /**
     * Registers one or more output values.
     * @param outputs Dictionary containg output values.
     */
    public addOutputs(outputs: Record<string, unknown>) {
        Object.assign(this.outputs, outputs);
    }

    /**
     * Registers an app module witin app.
     * Allows to decompose application into smaller pieces.
     * Added module can be then retrieved with `getModule`.
     * @param def Module definition
     */
    public addModule<TModule>(def: PulumiAppModuleDefinition<TModule, void>): TModule;

    /**
     * Registers an app module witin app.
     * Allows to decompose application into smaller pieces.
     * Added module can be then retrieved with `getModule`.
     * @param def Module definition
     * @param config Module config
     */
    public addModule<TModule, TConfig>(
        def: PulumiAppModuleDefinition<TModule, TConfig>,
        config: TConfig
    ): TModule;
    public addModule<TModule, TConfig>(
        def: PulumiAppModuleDefinition<TModule, TConfig>,
        config?: TConfig
    ) {
        if (this.modules.has(def.symbol)) {
            throw new Error(
                `Module "${def.name}" is already present in the "${this.name}" application.`
            );
        }

        const module = def.run(this, config as TConfig);
        this.modules.set(def.symbol, module);

        return module;
    }

    /**
     * Schedules a handler to be executed when running pulumi script.
     * Anything, that is returned from handler will be wrapped in pulumi.Output
     * so it can be used in other places.
     * @param handler Handler to be executed.
     * @returns Result of the handler wrapped with pulumi.Output
     */
    public addHandler<T>(handler: () => Promise<T> | T) {
        const promise = new Promise<T>(resolve => {
            this.handlers.push(async () => {
                resolve(await handler());
            });
        });

        return pulumi.output(promise);
    }

    /**
     * Returns a module by its definition
     * @param def Module definition
     */
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

    /** Internal usage only. */
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
