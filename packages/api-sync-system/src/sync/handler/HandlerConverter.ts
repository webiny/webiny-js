import type {
    ICommandConverter,
    ICommandValue,
    IDynamoDbCommand,
    IHandlerConverter
} from "../types.js";

export interface IHandlerConverterParams {
    defaultValue: ICommandValue;
}

export class HandlerConverter implements IHandlerConverter {
    private readonly defaultValue: ICommandValue;
    private readonly converters: ICommandConverter[] = [];

    public constructor(params: IHandlerConverterParams) {
        this.defaultValue = params.defaultValue;
    }

    public register(input: ICommandConverter | ICommandConverter[]): void {
        if (Array.isArray(input)) {
            this.converters.push(...input);
            return;
        }

        this.converters.push(input);
    }

    public convert(command: IDynamoDbCommand): ICommandValue {
        for (const converter of this.converters) {
            if (converter.can(command)) {
                return converter.convert(command);
            }
        }
        if (process.env.DEBUG === "true") {
            console.error(`Unknown command: ${command.constructor?.name || "unknown"}`);
            if (!command.constructor?.name) {
                console.error(
                    "Command is not an instance of a class, it might be a plain object. Stringified command is in next line."
                );
                console.log(
                    JSON.stringify({
                        command
                    })
                );
            }
        }

        return this.defaultValue;
    }
}

export const createHandlerConverter = (params: IHandlerConverterParams): IHandlerConverter => {
    return new HandlerConverter(params);
};
