import { createAbstraction } from "~/abstractions/createAbstraction.js";

export interface IGlobalOptionConfig {
    type: "boolean" | "number" | "string";
    description: string;
    default?: any;
    alias?: string;
    choices?: string[];
}

export interface IGlobalOptionDefinition {
    name: string;
    config: IGlobalOptionConfig;
}

export interface IGlobalOption {
    execute(): Promise<IGlobalOptionDefinition> | IGlobalOptionDefinition;
}

export const GlobalOption = createAbstraction<IGlobalOption>("GlobalOption");

export namespace GlobalOption {
    export type Interface = IGlobalOption;
    export type Definition = IGlobalOptionDefinition;
    export type Config = IGlobalOptionConfig;
}

