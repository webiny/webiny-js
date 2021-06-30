import longTextStoragePlugin from "../../../../src/dynamoDb/storage/longText";

const defaultArgs = {
    field: {
        fieldId: "longTextFieldId"
    },
    model: {
        modelId: "longTextModel"
    },
    entry: {
        savedOn: new Date()
    }
};

const testValue = `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`;

const expectedCompressedValue = `H4sIAAAAAAAAEzWQwXFDMQhEW9kCPL+K5JZrCiCI7zAjCVkCj8sPyk9uQsCy+z5sSoOOFQ3Fqk0sdVATv4GtL2EXjwkqOnSx9jukajaXlFyAaKxmBS5t5LJ21qIluiMclb5SHuKXtKDRvROo6iPowKdDurbURtP9eGZJ7YZH6EK35TMK5CWT1cnVOqJWamyX8h7SpfvSr6SOHIZQGm/pya4AecoPvG1JChfojHRyZdWOKWPKt/QiM4Pnx9NqjDwnaSeTQtYSsNb6TygDBc64Kzn6NoRBM4uYB95fLMMlNsZkYMwknHMcQwv53sgUY5oW6ZviJpVHOeqgnRt2nspKKLJk7m6zum3QBqSJY/1xjXb8AL3Fspi9AQAA`;

describe("longTextStoragePlugin", () => {
    test("toStorage should transform value for storage", async () => {
        const plugin = longTextStoragePlugin();

        const result = await plugin.toStorage({
            ...defaultArgs,
            value: testValue
        } as any);

        expect(result).toEqual({
            compression: "gzip",
            value: expectedCompressedValue
        });
    });

    test("fromStorage should transform value for output", async () => {
        const value = {
            compression: "gzip",
            value: expectedCompressedValue
        };
        const plugin = longTextStoragePlugin();

        const result = await plugin.fromStorage({
            ...defaultArgs,
            value
        } as any);

        expect(result).toEqual(testValue);
    });

    test("toStorage should transform value for storage multipleValues", async () => {
        const plugin = longTextStoragePlugin();

        const result = await plugin.toStorage({
            ...defaultArgs,
            value: [testValue, testValue, testValue]
        } as any);

        expect(result).toEqual({
            compression: "gzip",
            value: [expectedCompressedValue, expectedCompressedValue, expectedCompressedValue]
        });
    });

    test("fromStorage should transform value for output multipleValues", async () => {
        const value = {
            compression: "gzip",
            value: [expectedCompressedValue, expectedCompressedValue]
        };
        const plugin = longTextStoragePlugin();

        const result = await plugin.fromStorage({
            ...defaultArgs,
            value
        } as any);

        expect(result).toEqual([testValue, testValue]);
    });
});
