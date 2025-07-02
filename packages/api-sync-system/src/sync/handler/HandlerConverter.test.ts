import { PutCommand } from "@webiny/aws-sdk/client-dynamodb";
import { createHandlerConverter, HandlerConverter } from "~/sync/handler/HandlerConverter";
import { NullCommandValue } from "~/sync/handler/converter/commands/NullCommandValue.js";

describe("HandlerConverter", () => {
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
});
