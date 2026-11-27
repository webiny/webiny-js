import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import type { CmsModel } from "~/types.js";
import { EntryGraphQLFields as Abstraction } from "./abstractions.js";
import { EntryGraphQLFields } from "./EntryGraphQLFields.js";

const createModel = (tags: string[]) => ({ tags, metadata: {}, fields: [] }) as unknown as CmsModel;

const resolve = () => {
    const container = new Container();
    container.register(EntryGraphQLFields);
    return container.resolve(Abstraction);
};

describe("EntryGraphQLFields", () => {
    it("should include meta but not wbyAco_location for singleton models", () => {
        const fields = resolve().getSystemFields(createModel(["singleEntry"]));

        expect(fields).toContain("meta {");
        expect(fields).not.toContain("wbyAco_location");
    });

    it("should include meta and wbyAco_location for regular models", () => {
        const fields = resolve().getSystemFields(createModel([]));

        expect(fields).toContain("meta {");
        expect(fields).toContain("wbyAco_location");
    });
});
