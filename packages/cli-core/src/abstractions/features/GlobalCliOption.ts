import { createAbstraction } from "~/abstractions/createAbstraction.js";

export interface IGlobalCliOptionConfig {
    type: "boolean" | "number" | "string";
    description: string;
    default?: any;
    alias?: string;
    choices?: string[];
}

export interface IGlobalCliOptionDefinition {
    name: string;
    config: IGlobalCliOptionConfig;
}

export interface IGlobalCliOption {
    execute(): Promise<IGlobalCliOptionDefinition> | IGlobalCliOptionDefinition;
}

export const GlobalCliOption = createAbstraction<IGlobalCliOption>("GlobalCliOption");

export namespace GlobalCliOption {
    export type Interface = IGlobalCliOption;
    export type Definition = IGlobalCliOptionDefinition;
    export type Config = IGlobalCliOptionConfig;
}


