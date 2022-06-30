import findUp from "find-up";
import path from "path";
import * as pulumi from "@pulumi/pulumi";
import { PulumiAppModuleDefinition } from "./PulumiAppModule";
import {
    PulumiAppResourceArgs,
    PulumiAppResourceConstructor,
    PulumiAppResourceType,
    PulumiAppResource,
    CreatePulumiAppResourceParams,
    PulumiAppResourceConfigSetter,
    PulumiAppResourceConfigModifier,
    PulumiAppResourceConfigProxy
} from "./PulumiAppResource";
import {
    CreatePulumiAppParams,
    PulumiApp,
    PulumiAppParam,
    PulumiAppParamCallback,
    ResourceHandler
} from "~/types";
import { PulumiAppRemoteResource } from "~/PulumiAppRemoteResource";

export function createPulumiApp<TResources extends Record<string, unknown>>(
    params: CreatePulumiAppParams<TResources>
): PulumiApp<TResources> {
    let projectRootPath = findUp.sync("webiny.project.ts");
    if (projectRootPath) {
        projectRootPath = path.dirname(projectRootPath).replace(/\\/g, "/");
    } else {
        throw new Error("Couldn't detect Webiny project.");
    }

    const appRelativePath = params.path;
    const appRootPath = path.join(projectRootPath, appRelativePath);

    const projectAppWorkspacePath = path.join(
        projectRootPath,
        ".webiny",
        "workspaces",
        appRelativePath
    );

    const app: PulumiApp<TResources> = {
        resourceHandlers: [],
        handlers: [],
        outputs: {},
        modules: new Map<symbol, unknown>(),
        paths: {
            absolute: appRootPath,
            relative: appRelativePath,
            workspace: projectAppWorkspacePath
        },

        resources: {} as TResources,
        name: params.name,
        program: params.program,
        params: {
            create: params.config || {},
            run: {}
        },

        async run(config) {
            app.params.run = config;

            Object.assign(app.resources, await app.program(app));

            for (const handler of app.handlers) {
                await handler();
            }

            app.params.run = {};

            return app.outputs;
        },

        onResource(handler: ResourceHandler) {
            app.resourceHandlers.push(handler);
        },

        /**
         * Adds a resource to pulumi app.
         * It's not running the script immediately, but enqueues the call.
         * This way we are still able to modify the config of the resource.
         * @param resourceConstructor Resource to be added, ie aws.s3.Bucket
         * @param params Parameters to configure the resource
         * @returns Object giving access to both resource outputs and its config.
         */
        addResource<T extends PulumiAppResourceConstructor>(
            resourceConstructor: T,
            params: CreatePulumiAppResourceParams<T>
        ) {
            const config = params.config ?? ({} as PulumiAppResourceArgs<T>);
            const opts = params.opts ?? {};

            const promise = new Promise<PulumiAppResourceType<T>>(resolve => {
                app.handlers.push(() => {
                    resolve(new resourceConstructor(resource.name, config, opts));
                });
            });

            const resource: PulumiAppResource<T> = {
                name: params.name,
                config: createPulumiAppResourceConfigProxy(config),
                opts,
                output: pulumi.output(promise)
            };

            app.resourceHandlers.forEach(handler => handler(resource));

            return resource;
        },

        addRemoteResource<T>(name: string, getter: () => Promise<T>) {
            const promise = getter();

            const resource: PulumiAppRemoteResource<T> = {
                name,
                output: pulumi.output(promise)
            };

            return resource;
        },

        /**
         * Registers output value within pulumi app.
         * @param name Name of the output value
         * @param output Value of the output
         */
        addOutput<T>(name: string, output: T) {
            app.outputs[name] = output;
        },

        /**
         * Registers one or more output values.
         * @param outputs Dictionary containing output values.
         */
        addOutputs(outputs: Record<string, unknown>) {
            Object.assign(app.outputs, outputs);
        },

        /**
         * Registers an app module within app.
         * Allows to decompose application into smaller pieces.
         * Added module can be then retrieved with `getModule`.
         * @param module
         * @param config
         */
        addModule<TModule, TConfig>(
            module: PulumiAppModuleDefinition<TModule, TConfig>,
            config?: TConfig
        ) {
            if (app.modules.has(module.symbol)) {
                throw new Error(
                    `Module "${module.name}" is already present in the "${app.name}" application.`
                );
            }

            const createdModule = module.run(app, config as TConfig);
            app.modules.set(module.symbol, createdModule);

            return createdModule;
        },

        /**
         * Returns a module by its definition
         * @param def
         * @param opts
         */
        getModule<TConfig, TModule>(
            def: PulumiAppModuleDefinition<TModule, TConfig>,
            opts?: { optional: boolean }
        ) {
            const module = app.modules.get(def.symbol);

            if (!module) {
                if (opts?.optional) {
                    return null;
                } else {
                    throw new Error(`Module "${def.name}" not found in "${app.name}" app`);
                }
            }

            return module;
        },

        /**
         * Schedules a handler to be executed when running pulumi script.
         * Anything, that is returned from handler will be wrapped in pulumi.Output
         * so it can be used in other places.
         * @param handler Handler to be executed.
         * @returns Result of the handler wrapped with pulumi.Output
         */
        addHandler<T>(handler: () => Promise<T> | T) {
            const promise = new Promise<T>(resolve => {
                app.handlers.push(async () => {
                    resolve(await handler());
                });
            });

            return pulumi.output(promise);
        },

        getParam<T>(param: PulumiAppParam<T>) {
            if (typeof param === "function") {
                return (param as PulumiAppParamCallback<T>)(app);
            }

            return param;
        }
    };

    return app;
}

function createPulumiAppResourceConfigProxy<T extends object>(obj: T) {
    return new Proxy(obj, {
        get(target, p: string) {
            type V = T[keyof T];
            const key = p as keyof T;
            const setter: PulumiAppResourceConfigSetter<V> = (
                value: V | PulumiAppResourceConfigModifier<V>
            ) => {
                if (typeof value === "function") {
                    const modifier = value as PulumiAppResourceConfigModifier<V>;
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
    }) as PulumiAppResourceConfigProxy<T>;
}
