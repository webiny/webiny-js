import { describe, expect, it } from "vitest";
import { Context } from "~/index";
import { Benchmark } from "~/Benchmark";
import { BenchmarkPlugin } from "~/plugins/BenchmarkPlugin";
import { PluginsContainer } from "@webiny/plugins";

describe("Context", () => {
    it("should construct a base context", () => {
        const context = new Context({
            WEBINY_VERSION: "test"
        });

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

        expect(context.plugins.all()[0].name).toEqual(new BenchmarkPlugin(context.benchmark).name);

        expect(context.plugins.all()).toHaveLength(1);

        expect(context.WEBINY_VERSION).toEqual("test");
    });
});
