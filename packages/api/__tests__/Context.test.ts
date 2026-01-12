import { describe, expect, it } from "vitest";
import { CompressorPlugin, Context } from "~/index";
import { Benchmark } from "~/Benchmark";
import { BenchmarkPlugin } from "~/plugins/BenchmarkPlugin";
import { GzipCompression, JsonpackCompression } from "@webiny/utils/compression";
import { PluginsContainer } from "@webiny/plugins";

describe("Context", () => {
    it("should construct a base context", () => {
        const context = new Context({
            WEBINY_VERSION: "test"
        });

        const compressor = context.compressor;

        expect(context).toBeInstanceOf(Context);
        expect(context).toMatchObject({
            benchmark: expect.any(Benchmark),
            plugins: {
                _byTypeCache: {},
                plugins: {}
            },
            WEBINY_VERSION: "test",
            waiters: []
        });

        expect(context.plugins).toBeInstanceOf(PluginsContainer);

        expect(context.plugins.all()[0].name).toEqual(new JsonpackCompression().name);
        expect(context.plugins.all()[1].name).toEqual(new GzipCompression().name);
        expect(context.plugins.all()[2].name).toEqual(new BenchmarkPlugin(context.benchmark).name);
        expect(context.plugins.all()[3].name).toEqual(
            new CompressorPlugin({
                getCompressor() {
                    return compressor;
                }
            }).name
        );

        expect(context.plugins.all()).toHaveLength(4);

        expect(context.WEBINY_VERSION).toEqual("test");
    });
});
