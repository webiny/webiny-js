import { describe, it, expect } from "vitest";
import { getDefaultComponentLoader } from "@webiny/website-builder-nextjs";
import * as sdkNextjs from "../src/index.js";

/*
 * Importing `@webiny/sdk-nextjs` used to set a default component loader as a side effect, so a
 * content client without its own `componentLoader` loaded unregistered components over GraphQL.
 * That loader is gone: a site that loads its own components sets a loader itself.
 */
describe("@webiny/sdk-nextjs", () => {
    it("sets no default component loader on import", () => {
        expect(sdkNextjs).toBeDefined();
        expect(getDefaultComponentLoader()).toBeUndefined();
    });

    it("no longer exports the remote component loader or sandbox", () => {
        const exports = sdkNextjs as Record<string, unknown>;

        expect(exports.createGraphQLComponentLoader).toBeUndefined();
        expect(exports.GraphQLRemoteComponentLoader).toBeUndefined();
        expect(exports.ComponentSandbox).toBeUndefined();
    });
});
