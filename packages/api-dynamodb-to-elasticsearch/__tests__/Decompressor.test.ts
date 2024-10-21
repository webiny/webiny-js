import { createGzipCompression } from "@webiny/api-elasticsearch";
import { Decompressor } from "~/Decompressor";
import { createPlugins } from "~tests/plugins";
import { FaultyDecompressorPlugin } from "~tests/mocks/FaultyDecompressorPlugin";
import { PluginsContainer } from "@webiny/plugins";

const compressor = createGzipCompression();

describe("Decompressor", () => {
    it("should not do anything with the data because it is not compressed", async () => {
        const decompressor = new Decompressor({
            plugins: createPlugins()
        });

        const data = {
            title: "Hello World"
        };

        const result = await decompressor.decompress(data);
        expect(result).toEqual(data);
    });

    it("should decompress the data", async () => {
        const decompressor = new Decompressor({
            plugins: createPlugins()
        });

        const input = Object.freeze({
            title: "Hello World"
        });

        const data = Object.freeze(await compressor.compress(input));

        const result = await decompressor.decompress(data);
        expect(result).toEqual(input);
    });

    it("should return null because something is wrong with the compressed data", async () => {
        const decompressor = new Decompressor({
            plugins: createPlugins()
        });

        const data = {
            value: "some wrong value which cannot be decompressed",
            compression: "gzip"
        };

        const result = await decompressor.decompress(data);
        expect(result).toEqual(null);
    });

    it("should return null even if decompress throws an error", async () => {
        const decompressor = new Decompressor({
            plugins: new PluginsContainer([new FaultyDecompressorPlugin()])
        });

        const data = {
            value: "some wrong value which cannot be decompressed",
            compression: "gzip"
        };

        const result = await decompressor.decompress(data);
        expect(result).toEqual(null);
    });
});
