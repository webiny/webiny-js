import { PulumiApp } from "./types";

export interface PulumiAppModuleCallback<TModule, TConfig> {
    (this: void, app: PulumiApp, config: TConfig): TModule;
}

export interface PulumiAppModuleParams<TModule, TConfig> {
    name: string;
    config: PulumiAppModuleCallback<TModule, TConfig>;
}

export type PulumiAppModule<T extends PulumiAppModuleDefinition<any, any>> =
    T extends PulumiAppModuleDefinition<infer V, any> ? V : never;

export class PulumiAppModuleDefinition<TModule, TConfig> {
    public readonly symbol = Symbol();
    public readonly name: string;
    public readonly run: PulumiAppModuleCallback<TModule, TConfig>;
    constructor(params: PulumiAppModuleParams<TModule, TConfig>) {
        this.name = params.name;
        this.run = params.config;
    }
}

export function createAppModule<TModule, TConfig = void>(
    params: PulumiAppModuleParams<TModule, TConfig>
) {
    return new PulumiAppModuleDefinition(params);
}
