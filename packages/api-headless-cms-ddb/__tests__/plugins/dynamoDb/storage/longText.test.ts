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
    it("should compress and decompress single long text value", async () => {
        const plugin = createLongTextStorageTransformPlugin();

        const value = "some text which is going to get compressed";

        const compressResult = await plugin.toStorage({
            ...defaultArgs,
            value
        });

        expect(compressResult).toEqual({
            compression: "gzip",
            value: expect.any(String)
        });

        const decompressResult = await plugin.fromStorage({
            ...defaultArgs,
            value: compressResult
        });

        expect(decompressResult).toEqual(value);
    });

    it("should compress and decompress multiple value long text", async () => {
        const plugin = createLongTextStorageTransformPlugin();

        const value: string[] = [
            "some text which is going to get compressed",
            "some text which is going to get compressed 2",
            "some text which is going to get compressed 3"
        ];

        const compressResult = await plugin.toStorage({
            ...defaultArgs,
            value
        });

        expect(compressResult).toEqual({
            compression: "gzip",
            value: expect.any(String),
            isArray: true
        });

        /**
         * In the end, we need to get what we sent in.
         */
        const decompressResult = await plugin.fromStorage({
            ...defaultArgs,
            value: compressResult
        });
        expect(decompressResult).toEqual(value);
    });
});
