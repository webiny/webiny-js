import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { parse, type ObjectTypeExtensionNode } from "graphql";
import { pageCompositionTypeDefs } from "./typeDefs.js";

/*
 * A field with no resolver answers null, not an error: the page map query once went missing this way
 * while the schema still declared it (2026-10-09). Every Query and Mutation field declared here must
 * have a resolver registered in schema.ts.
 */
describe("page composition GraphQL", () => {
    it("registers a resolver for every Query and Mutation field it declares", () => {
        const document = parse(pageCompositionTypeDefs);
        const declared = document.definitions
            .filter(
                (node): node is ObjectTypeExtensionNode =>
                    node.kind === "ObjectTypeExtension" &&
                    (node.name.value === "Query" || node.name.value === "Mutation")
            )
            .flatMap(node =>
                (node.fields ?? []).map(field => `${node.name.value}.${field.name.value}`)
            );
        const schema = readFileSync(new URL("./schema.ts", import.meta.url), "utf8");
        const registered = [...schema.matchAll(/path: "([A-Za-z]+\.[A-Za-z]+)"/g)].map(
            match => match[1]
        );

        expect(declared.length).toBeGreaterThan(0);
        expect(declared.filter(field => !registered.includes(field))).toEqual([]);
    });
});
