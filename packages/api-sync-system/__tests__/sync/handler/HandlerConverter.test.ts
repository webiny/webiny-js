import { PutCommand } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { createHandlerConverter, HandlerConverter } from "~/sync/handler/HandlerConverter.js";
import { NullCommandValue } from "~/sync/handler/converter/commands/NullCommandValue.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("HandlerConverter", () => {
    beforeEach(() => {
        process.env.DEBUG = "true";
    });

    it("should create an empty handler converter", () => {
        const def = new NullCommandValue();
        // @ts-expect-error
        def.__test = true;
        const handlerConverter = createHandlerConverter({
            defaultValue: def
        });

        expect(handlerConverter).toBeInstanceOf(HandlerConverter);
        // @ts-expect-error
        expect(handlerConverter.converters).toHaveLength(0);
        // @ts-expect-error
        expect(handlerConverter.defaultValue).toBeInstanceOf(NullCommandValue);
        // @ts-expect-error
        expect(handlerConverter.defaultValue.__test).toBeTrue();
    });

    it("should return null command value as no command converters are present in handler converter", async () => {
        const def = new NullCommandValue();
        // @ts-expect-error
        def.__test = true;
        const handlerConverter = createHandlerConverter({
            defaultValue: def
        });

        const result = handlerConverter.convert(
            new PutCommand({
                TableName: process.env.DB_TABLE,
                Item: {
                    PK: "p1",
                    SK: "s1"
                }
            })
        );
        expect(result).toBeInstanceOf(NullCommandValue);
        // @ts-expect-error
        expect(result.__test).toBeTrue();
    });

    it("should log errors and return null value when command is plain object", () => {
        const def = new NullCommandValue();
        const handlerConverter = createHandlerConverter({
            defaultValue: def
        });

        console.error = vi.fn();
        console.log = vi.fn();

        const result = handlerConverter.convert({} as any);
        expect(result).toEqual(def);

        expect(console.error).toHaveBeenCalledTimes(1);
        expect(console.log).toHaveBeenCalledTimes(0);

        expect(console.error).toHaveBeenCalledWith("Unknown command: Object");
    });

    it("should log errors and return null value when command is does not have a constructor name", () => {
        const def = new NullCommandValue();
        const handlerConverter = createHandlerConverter({
            defaultValue: def
        });

        console.error = vi.fn();
        console.log = vi.fn();

        const value = {
            constructor: {
                name: undefined
            }
        } as any;

        const result = handlerConverter.convert(value);
        expect(result).toEqual(def);

        expect(console.error).toHaveBeenCalledTimes(2);
        expect(console.log).toHaveBeenCalledTimes(1);

        expect(console.error).toHaveBeenNthCalledWith(1, "Unknown command: unknown");
        expect(console.error).toHaveBeenNthCalledWith(
            2,
            "Command is not an instance of a class, it might be a plain object. Stringified command is in next line."
        );
    });
});
