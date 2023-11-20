import { createLongTextStorageTransformPlugin } from "~/dynamoDb/storage/longText";
import { FromStorageParams, StorageTransformPlugin } from "@webiny/api-headless-cms";
import { createStoragePluginsContainer } from "./plugins";
import { CmsModel, CmsModelField } from "@webiny/api-headless-cms/types";

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
    } as CmsModelField,
    model: {
        modelId: "longTextModel"
    } as CmsModel,
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

    it("should do nothing when decompressing a non-compressed value - string", async () => {
        const plugin = createLongTextStorageTransformPlugin();

        const value: any = "some text which is going to get compressed";

        const decompressResult = await plugin.fromStorage({
            ...defaultArgs,
            value
        });
        expect(decompressResult).toEqual(value);
    });

    it("should do nothing when decompressing a non-compressed value - number", async () => {
        const plugin = createLongTextStorageTransformPlugin();

        const value: any = 1234567890;

        const decompressResult = await plugin.fromStorage({
            ...defaultArgs,
            value
        });
        expect(decompressResult).toEqual(value);
    });

    it("should do nothing when decompressing a non-compressed value - array", async () => {
        const plugin = createLongTextStorageTransformPlugin();

        const value: any = ["some text which is going to get compressed"];

        const decompressResult = await plugin.fromStorage({
            ...defaultArgs,
            value
        });
        expect(decompressResult).toEqual(value);
    });

    it("should fail with decompression because no compression definition value exists", async () => {
        const plugin = createLongTextStorageTransformPlugin();

        let error: any = undefined;
        try {
            await plugin.fromStorage({
                ...defaultArgs,
                value: {}
            } as FromStorageParams<any, any>);
        } catch (ex: any) {
            error = {
                message: ex.message,
                code: ex.code,
                data: ex.data
            };
        }
        expect(error).toEqual({
            message: `Missing compression in "fromStorage" function in field "longTextStorageFieldId" - longTextFieldId.": {}.`,
            code: "MISSING_COMPRESSION",
            data: expect.any(Object)
        });
    });

    it("should not compress already compressed value", async () => {
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

        const compressAgainResult = await plugin.toStorage({
            ...defaultArgs,
            value
        });

        expect(compressAgainResult).toEqual({
            compression: "gzip",
            value: expect.any(String),
            isArray: true
        });

        const decompressResult = await plugin.fromStorage({
            ...defaultArgs,
            value: compressAgainResult
        });
        expect(decompressResult).toEqual(value);
    });
});
