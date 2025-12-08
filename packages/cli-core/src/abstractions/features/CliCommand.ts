import { createAbstraction } from "~/abstractions/createAbstraction.js";

export interface ICliCommandParamDefinition<TCommandParams> {
    name: string;
    description: string;
    type: "boolean" | "number" | "string";
    required?: boolean;
    array?: boolean;
    default?: any;
    validation?: (value: TCommandParams) => boolean | string;
}

export interface ICliCommandOptionDefinition<TCommandParams> {
    name: string;
    description: string;
    type: "boolean" | "number" | "string";
    group?: string;
    required?: boolean;
    alias?: string;
    default?: any;
    validation?: (value: TCommandParams) => boolean | string;
}

export interface ICliCommandDefinition<TCommandParams> {
    name: string;
    description: string;
    params?: ICliCommandParamDefinition<TCommandParams>[];
    options?: ICliCommandOptionDefinition<TCommandParams>[];
    examples?: string[];
    handler: (params: TCommandParams) => void | Promise<void>;
}

export interface ICliCommand<TCommandParams> {
    execute():
        | Promise<ICliCommandDefinition<TCommandParams>>
        | ICliCommandDefinition<TCommandParams>;
}

export const CliCommand = createAbstraction<ICliCommand<any>>("CliCommand");

export namespace CliCommand {
    export type Interface<TCommandParams> = ICliCommand<TCommandParams>;

    export type ParamDefinition<TCommandParams> = ICliCommandParamDefinition<TCommandParams>;
    export type OptionDefinition<TCommandParams> = ICliCommandOptionDefinition<TCommandParams>;

    export type CommandDefinition<TCommandParams> = ICliCommandDefinition<TCommandParams>;
}
