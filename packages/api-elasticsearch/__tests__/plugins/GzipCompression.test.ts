import gzipCompressionPlugin from "~/plugins/GzipCompression";
import { CompressionPlugin } from "~/plugins/definition/CompressionPlugin";

const text = "Regular text.";
const compressedText = "H4sIAAAAAAAAE1MKSk0vzUksUihJrSjRUwIAFvjosg8AAAA=";

describe("gzip compression", () => {
    let plugin: CompressionPlugin;

    beforeEach(() => {
        plugin = gzipCompressionPlugin();
    });

    it("should compress given text value", async () => {
        const result = await plugin.compress(text);

        expect(result).toEqual({
            compression: "gzip",
            value: compressedText
        });
    });

    it("should decompress given text value", async () => {
        const result = await plugin.decompress({
            value: compressedText,
            compression: "gzip"
        });

        expect(result).toEqual(text);
    });
});
