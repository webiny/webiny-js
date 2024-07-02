import * as pulumi from "@pulumi/pulumi";
import { PulumiAppModuleDefinition } from "./PulumiAppModule";
import {
    PulumiAppResourceConstructor,
    PulumiAppResource,
    CreatePulumiAppResourceParams
} from "./PulumiAppResource";
import { PulumiAppRemoteResource } from "~/PulumiAppRemoteResource";

export interface ResourceHandler {
    (resource: PulumiAppResource<PulumiAppResourceConstructor>): void;
}

export type PulumiAppParamCallback<T> = (app: PulumiApp) => T | undefined;
export type PulumiAppParam<T> = T | PulumiAppParamCallback<T>;

export type PulumiProgram<TApp = PulumiApp, TResources = Record<string, any>> = (
    app: TApp
) => TResources | Promise<TResources>;

export type CreateConfig = Record<string, any>;
export type RunConfig = Record<string, any>;

export interface CreatePulumiAppParams<TResources extends Record<string, unknown>> {
    name: string;
    path: string;
    config?: CreateConfig;

    program(app: PulumiApp): TResources | Promise<TResources>;
}

export interface ProgramDecorator<TApp, TResources> {
    (program: PulumiProgram<TApp, TResources>, app: TApp): ReturnType<PulumiProgram<TResources>>;
}

export interface PulumiApp<TResources = Record<string, unknown>> {
    resourceHandlers: ResourceHandler[];
    handlers: (() => void | Promise<void>)[];
    outputs: Record<string, any>;
    modules: Map<symbol, unknown>;

    paths: { absolute: string; relative: string; workspace: string };
    name: string;
    decorateProgram: <T>(
        decorator: ProgramDecorator<PulumiApp<TResources> & T, TResources>
    ) => void;
    program: PulumiProgram;
    resources: TResources;
    params: {
        create: CreateConfig;
        run: RunConfig;
    };
    env: {
        name: string;

        // Set to `true` if the environment into which the application is being deployed
        // is considered a production environment. The list of environment names
        // that are considered production environments is defined via the
        // `productionEnvironments` parameter. Learn more:
        // https://www.webiny.com/docs/infrastructure/basics/modify-cloud-infrastructure#defining-multiple-production-environments
        isProduction: boolean;
    };

    run(params: RunConfig): Record<string, any>;

    onResource(handler: ResourceHandler): void;

    addResource<T extends PulumiAppResourceConstructor>(
        resourceConstructor: T,
        params: CreatePulumiAppResourceParams<T>
    ): PulumiAppResource<T>;

    addRemoteResource<T>(name: string, getter: () => Promise<T>): PulumiAppRemoteResource<T>;

    addOutput<T>(name: string, output: T): void;

    addOutputs(outputs: Record<string, unknown>): void;

    addModule<TModule>(def: PulumiAppModuleDefinition<TModule, void>): TModule;

    addModule<TModule, TConfig>(
        def: PulumiAppModuleDefinition<TModule, TConfig>,
        config: TConfig
    ): TModule;

    getModule<TConfig, TModule>(def: PulumiAppModuleDefinition<TModule, TConfig>): TModule;

    getModule<TConfig, TModule>(
        def: PulumiAppModuleDefinition<TModule, TConfig>,
        opts: { optional: false }
    ): TModule;

    getModule<TConfig, TModule>(
        def: PulumiAppModuleDefinition<TModule, TConfig>,
        opts: { optional: true }
    ): TModule | null;

    addHandler<T>(handler: () => Promise<T> | T): pulumi.Output<pulumi.Unwrap<T>>;

    getParam<T>(param: T | ((app: PulumiApp) => T)): T | undefined;
}
