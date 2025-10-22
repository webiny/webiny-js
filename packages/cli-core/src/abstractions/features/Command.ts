import { Abstraction } from "@webiny/di-container";

export interface ICommandParamDefinition<TCommandParams> {
    name: string;
    description: string;
    type: "boolean" | "number" | "string";
    required?: boolean;
    array?: boolean;
    default?: any;
    validation?: (value: TCommandParams) => boolean | string;
}

export interface ICommandOptionDefinition<TCommandParams> {
    name: string;
    description: string;
    type: "boolean" | "number" | "string";
    group?: string;
    required?: boolean;
    alias?: string;
    default?: any;
    validation?: (value: TCommandParams) => boolean | string;
}

export interface ICommandDefinition<TCommandParams> {
    name: string;
    description: string;
    params?: ICommandParamDefinition<TCommandParams>[];
    options?: ICommandOptionDefinition<TCommandParams>[];
    examples?: string[];
    handler: (params: TCommandParams) => void | Promise<void>;
}

export interface ICommand<TCommandParams> {
    execute(): Promise<ICommandDefinition<TCommandParams>> | ICommandDefinition<TCommandParams>;
}

export const Command = new Abstraction<ICommand<any>>("Command");

export namespace Command {
    export type Interface<TCommandParams> = ICommand<TCommandParams>;

    export type ParamDefinition<TCommandParams> = ICommandParamDefinition<TCommandParams>;
    export type OptionDefinition<TCommandParams> = ICommandOptionDefinition<TCommandParams>;

    export type CommandDefinition<TCommandParams> = ICommandDefinition<TCommandParams>;
}
