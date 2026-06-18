import { beforeEach, describe, expect, it } from "vitest";
import type { OpenSearchContext as OpenSearchContextType } from "~/types.js";
import { Context } from "@webiny/api";
import { registerOpenSearchCore } from "~/index.js";
import { createOpenSearchClient } from "~tests/helpers.js";
import { OpenSearchContext } from "~/features/OpenSearchContext/abstraction.js";
import { OpenSearchClientFactory } from "~/features/OpenSearchClientFactory/abstraction.js";
import { OpenSearchClient } from "~/features/OpenSearchClient/abstraction.js";

describe("opensearch features", () => {
    let context: OpenSearchContextType;

    beforeEach(async () => {
        const client = createOpenSearchClient();
        // @ts-expect-error
        context = new Context({
            plugins: [],
            WEBINY_VERSION: "0.0.0"
        });
        const plugin = registerOpenSearchCore(client);

        await plugin.apply(context);
    });

    it("should have OpenSearchContext registered", async () => {
        const resolved = context.container.resolve(OpenSearchContext);
        expect(resolved).not.toBeNull();
    });

    it("should have OpenSearchClientFactory registered", async () => {
        const resolved = context.container.resolve(OpenSearchClientFactory);
        expect(resolved).not.toBeNull();
    });

    it("should have OpenSearchClient registered", async () => {
        const resolved = context.container.resolve(OpenSearchClient);
        expect(resolved).not.toBeNull();
    });
});
