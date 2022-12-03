import { createGzipCompression } from "~/plugins/GzipCompression";
import { CompressionPlugin } from "~/plugins/definition/CompressionPlugin";

const text = "Regular text that we will test in the compress and decompress.";

describe("gzip compression", () => {
    let plugin: CompressionPlugin;

    beforeEach(() => {
        plugin = createGzipCompression();
    });

    it("should compress and decompress given text value", async () => {
        const compressed = await plugin.compress(text);

        expect(compressed).toEqual({
            compression: "gzip",
            value: expect.any(String)
        });

        const decompressed = await plugin.decompress(compressed);

        expect(decompressed).toEqual(text);
    });
});
