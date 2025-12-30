import { describe, it, expect } from "vitest";
import { CompressorPlugin, Context } from "~/index";
import type { Context as ContextInterface } from "~/types";
import { Benchmark } from "~/Benchmark";
import { BenchmarkPlugin } from "~/plugins/BenchmarkPlugin";
import { GzipCompression, JsonpackCompression } from "@webiny/utils/compression";
import { PluginsContainer } from "@webiny/plugins";

interface DummyContextInterface extends ContextInterface {
    cms: any;
    pageBuilder: any;
}

describe("Context", () => {
    it("should construct a base context", () => {
        const context = new Context({
            WBY_VERSION: "test"
        });

        const compressor = context.compressor;

        expect(context).toBeInstanceOf(Context);
        expect(context).toMatchObject({
            benchmark: expect.any(Benchmark),
            plugins: {
                _byTypeCache: {},
                plugins: {}
            },
            WBY_VERSION: "test",
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

        expect(context.WBY_VERSION).toEqual("test");
    });

    it("should wait for a variable to be defined on context and then trigger the callable", async () => {
        const context = new Context({
            WBY_VERSION: "test"
        }) as unknown as DummyContextInterface;

        const tester = {
            cms: 0,
            pageBuilder: 0
        };

        context.waitFor("cms", () => {
            tester.cms++;
        });
        expect(context.cms).toBeUndefined();

        context.cms = {
            loaded: 1
        };

        expect(tester).toEqual({
            cms: 1,
            pageBuilder: 0
        });

        expect(context.cms).toEqual({
            loaded: 1
        });

        context.waitFor(["pageBuilder"], () => {
            tester.pageBuilder++;
        });

        context.pageBuilder = {
            loaded: true
        };

        expect(tester).toEqual({
            cms: 1,
            pageBuilder: 1
        });

        expect(context.pageBuilder).toEqual({
            loaded: true
        });
    });
});
