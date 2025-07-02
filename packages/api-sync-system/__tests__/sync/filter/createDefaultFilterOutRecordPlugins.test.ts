import {
    createDefaultFilterOutRecordPlugins,
    equalKeys,
    skipModels,
    startsWithKeys
} from "~/sync/filter/createDefaultFilterOutRecordPlugins";

describe("createDefaultFilterOutRecordPlugins", () => {
    it("should create default filter out record plugins", () => {
        const plugins = createDefaultFilterOutRecordPlugins();

        expect(plugins).toHaveLength(1);
    });

    it("should filter out key by equal", () => {
        expect.assertions(equalKeys.length + 1);

        const plugins = createDefaultFilterOutRecordPlugins();
        const plugin = plugins[0];

        expect(equalKeys.length > 0).toBe(true);

        for (const key of equalKeys) {
            expect(plugin.execute({ PK: key } as any)).toBe(true);
        }
    });

    it("should filter out key by startsWithKeys", () => {
        expect.assertions(startsWithKeys.length + 1);

        const plugins = createDefaultFilterOutRecordPlugins();
        const plugin = plugins[0];

        expect(startsWithKeys.length > 0).toBe(true);

        for (const key of startsWithKeys) {
            expect(plugin.execute({ PK: key } as any)).toBe(true);
        }
    });

    it("should filter out key by modelId in input.input.Item.modelId", () => {
        expect.assertions(skipModels.length + 1);
        const plugins = createDefaultFilterOutRecordPlugins();
        const plugin = plugins[0];

        expect(skipModels.length > 0).toBe(true);

        for (const key of skipModels) {
            expect(
                plugin.execute({
                    PK: "NOT_IMPORTANT",
                    input: {
                        input: {
                            Item: {
                                modelId: key
                            }
                        }
                    }
                } as any)
            ).toBe(true);
        }
    });

    it("should not filter out key by modelId in input.input.Item.modelId", () => {
        expect.assertions(3);
        const plugins = createDefaultFilterOutRecordPlugins();
        const plugin = plugins[0];

        expect(skipModels.length > 0).toBe(true);

        expect(
            plugin.execute({
                PK: "NOT_IMPORTANT",
                input: {
                    input: {
                        Item: {}
                    }
                }
            } as any)
        ).toBe(false);

        expect(
            plugin.execute({
                PK: "NOT_IMPORTANT",
                input: {
                    input: {
                        Item: {
                            modelId: "NON_FILTERABLE_MODEL_ID"
                        }
                    }
                }
            } as any)
        ).toBe(false);
    });
});
