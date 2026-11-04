import { describe, it, expect } from "vitest";
import { GET_PAGE_BY_PATH } from "./GET_PAGE_BY_PATH.js";
import { GET_PAGE_BY_ID } from "./GET_PAGE_BY_ID.js";

/**
 * Extracts the top-level fields selected inside the `data { ... }` block of a single-page query.
 * A field with its own selection set (e.g. `layout { ... }`) is listed by its name.
 */
const getDataSelection = (query: string): string[] => {
    const start = query.search(/data\s*\{/);
    if (start === -1) {
        throw new Error("Query has no `data` selection set.");
    }

    const fields: string[] = [];
    let depth = 0;
    for (const token of query.slice(start).split(/\s+/).filter(Boolean)) {
        if (token === "{") {
            depth++;
        } else if (token === "}") {
            depth--;
            if (depth === 0) {
                break;
            }
        } else if (depth === 1 && token !== "data") {
            fields.push(token);
        }
    }

    return fields;
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
            "languagePaths",
            "layout"
        ]);
    });
});
