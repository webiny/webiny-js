import { createLongTextStorageTransformPlugin } from "~/dynamoDb/storage/longText";
import { StorageTransformPlugin } from "@webiny/api-headless-cms";
import { createStoragePluginsContainer } from "./plugins";

const container = createStoragePluginsContainer();

const defaultPlugin = container
    .byType<StorageTransformPlugin>(StorageTransformPlugin.type)
    .find(plugin => {
        return plugin.fieldType === "*";
    });

const defaultArgs = {
    field: {
        fieldId: "longTextFieldId",
        storageId: "longTextStorageFieldId"
    } as any,
    model: {
        modelId: "longTextModel"
    } as any,
    plugins: container,
    getStoragePlugin: (fieldType: string) => {
        const plugins = container.byType<StorageTransformPlugin>(StorageTransformPlugin.type);

        const plugin = plugins.find(pl => pl.fieldType === fieldType);
        if (plugin) {
            return plugin;
        } else if (defaultPlugin) {
            return defaultPlugin;
        }
        throw new Error(`No plugin for field type "${fieldType}".`);
    }
};

describe("long text storage plugin", () => {
    it("should compress single long text value", async () => {
        const plugin = createLongTextStorageTransformPlugin();

        const result = await plugin.toStorage({
            ...defaultArgs,
            value: "some text which is going to get compressed"
        });

        expect(result).toEqual({
            compression: "gzip",
            value: "H4sIAAAAAAAAEwXBwQ0AIAgDwFW6GzbAQzHSRMf3rmsS4hNupAWy4ZXLoYJTsJr7sJvjA4APK+EqAAAA"
        });
    });

    it("should decompress single long text value", async () => {
        const plugin = createLongTextStorageTransformPlugin();

        const result = await plugin.fromStorage({
            ...defaultArgs,
            value: {
                compression: "gzip",
                value: "H4sIAAAAAAAAEwXBwQ0AIAgDwFW6GzbAQzHSRMf3rmsS4hNupAWy4ZXLoYJTsJr7sJvjA4APK+EqAAAA"
            }
        });

        expect(result).toEqual("some text which is going to get compressed");
    });

    it("should compress multiple value long text", async () => {
        const plugin = createLongTextStorageTransformPlugin();

        const result = await plugin.toStorage({
            ...defaultArgs,
            value: [
                "some text which is going to get compressed",
                "some text which is going to get compressed 2",
                "some text which is going to get compressed 3"
            ]
        });

        expect(result).toEqual({
            compression: "gzip",
            value: "H4sIAAAAAAAAE4tWKs7PTVUoSa0oUSjPyEzOUMgsVkjPz8xLVyjJV0hPLVFIzs8tKEotLk5NUdIhQbGCEWnKjZViAYk+xbqMAAAA",
            isArray: true
        });
    });

    it("should decompress multiple long text values", async () => {
        const plugin = createLongTextStorageTransformPlugin();

        const result = await plugin.fromStorage({
            ...defaultArgs,
            value: {
                compression: "gzip",
                value: "H4sIAAAAAAAAE4tWKs7PTVUoSa0oUSjPyEzOUMgsVkjPz8xLVyjJV0hPLVFIzs8tKEotLk5NUdIhQbGCEWnKjZViAYk+xbqMAAAA",
                isArray: true
            }
        });

        expect(result).toEqual([
            "some text which is going to get compressed",
            "some text which is going to get compressed 2",
            "some text which is going to get compressed 3"
        ]);
    });
});
