import { describe, expect, it } from "vitest";
import { parse } from "graphql";
import { componentExtractionTypeDefs } from "./typeDefs.js";

/*
 * The schema is a template string; nothing else parses it before the deployed API does. A description
 * placed between another field's description and its field built, type-checked and shipped, and took
 * the whole GraphQL API down (2026-10-09). This parses it here.
 */
describe("componentExtractionTypeDefs", () => {
    it("is valid GraphQL", () => {
        expect(() => parse(componentExtractionTypeDefs)).not.toThrow();
    });
});
