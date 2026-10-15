import { describe, it, expect } from "vitest";
import { GET_PAGE_BY_PATH } from "./GET_PAGE_BY_PATH.js";
import { GET_PAGE_BY_ID } from "./GET_PAGE_BY_ID.js";

/**
 * Extracts the fields selected inside the `data { ... }` block of a single-page query.
 * The block is flat (all scalars), so matching up to the first closing brace is enough.
 */
const getDataSelection = (query: string): string[] => {
    const match = query.match(/data\s*\{([^}]*)\}/);
    if (!match) {
        throw new Error("Query has no `data` selection set.");
    }

    return match[1]
        .split("\n")
        .map(line => line.trim())
        .filter(Boolean);
};

describe("single-page queries", () => {
    // These assertions exist because a missing `metadata` field previously forced consumers
    // to maintain a Yarn patch against the built SDK. Keep both queries selecting it.
    it.each([
        ["GET_PAGE_BY_PATH", GET_PAGE_BY_PATH],
        ["GET_PAGE_BY_ID", GET_PAGE_BY_ID]
    ])("%s selects metadata", (_name, query) => {
        expect(getDataSelection(query)).toContain("metadata");
    });

    // `PublicPage` also declares `state`, which is not sourced from the API and so is
    // deliberately absent from both queries.
    it.each([
        ["GET_PAGE_BY_PATH", GET_PAGE_BY_PATH],
        ["GET_PAGE_BY_ID", GET_PAGE_BY_ID]
    ])("%s selects exactly the expected fields", (_name, query) => {
        expect(getDataSelection(query)).toEqual([
            "id",
            "version",
            "properties",
            "metadata",
            "elements",
            "bindings",
            "extensions",
            "languagePaths"
        ]);
    });
});
