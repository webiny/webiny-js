import { describe, it, expect } from "vitest";
import { QueryMatcher } from "./QueryMatcher.js";

interface Row {
    id: string;
    folderId: string;
    savedOn?: string;
    values?: { title?: string };
}

const row = (id: string, savedOn?: string, folderId = "root"): Row => ({ id, folderId, savedOn });

const createMatcher = (config: Partial<ConstructorParameters<typeof QueryMatcher<Row>>[0]> = {}) =>
    new QueryMatcher<Row>({
        keyField: "id",
        localFilters: {
            folderId: (item, value) => item.folderId === value
        },
        ...config
    });

const ids = (rows: Row[]) => rows.map(r => r.id);

describe("QueryMatcher.select", () => {
    it("should only filter before the first query", () => {
        const matcher = createMatcher();

        expect(ids(matcher.select([row("b", "2"), row("a", "1")]))).toEqual(["b", "a"]);
    });

    it("should sort by the applied sort, regardless of cache order", () => {
        const matcher = createMatcher();
        matcher.updateFromQuery({ sort: { field: "savedOn", direction: "DESC" } }, ["c", "b", "a"]);

        const cached = [row("a", "1"), row("c", "3"), row("b", "2")];

        expect(ids(matcher.select(cached))).toEqual(["c", "b", "a"]);
    });

    it("should apply local filters", () => {
        const matcher = createMatcher();
        matcher.updateFromQuery(
            { filters: { folderId: "root" }, sort: { field: "savedOn", direction: "ASC" } },
            ["a", "b"]
        );

        const cached = [row("a", "1"), row("x", "0", "other"), row("b", "2")];

        expect(ids(matcher.select(cached))).toEqual(["a", "b"]);
    });

    it("should cut off items that sort past the last loaded item while more are available", () => {
        const matcher = createMatcher();
        matcher.updateFromQuery({ sort: { field: "savedOn", direction: "ASC" } }, ["a", "b"], true);

        // "z" was cached by another view and sorts after the loaded window.
        const cached = [row("z", "9"), row("a", "1"), row("b", "2")];

        expect(ids(matcher.select(cached))).toEqual(["a", "b"]);
    });

    it("should include items past the last loaded item when nothing more is available", () => {
        const matcher = createMatcher();
        matcher.updateFromQuery(
            { sort: { field: "savedOn", direction: "ASC" } },
            ["a", "b"],
            false
        );

        const cached = [row("z", "9"), row("a", "1"), row("b", "2")];

        expect(ids(matcher.select(cached))).toEqual(["a", "b", "z"]);
    });

    it("should extend the loaded window on appendResultKeys", () => {
        const matcher = createMatcher();
        matcher.updateFromQuery({ sort: { field: "savedOn", direction: "ASC" } }, ["a"], true);
        matcher.appendResultKeys(["b"], true);

        const cached = [row("c", "3"), row("b", "2"), row("a", "1")];

        expect(ids(matcher.select(cached))).toEqual(["a", "b"]);
    });

    it("should keep the server order for items with equal sort values", () => {
        const matcher = createMatcher();
        matcher.updateFromQuery({ sort: { field: "savedOn", direction: "DESC" } }, ["b", "a", "c"]);

        const cached = [row("a", "1"), row("c", "1"), row("b", "1")];

        expect(ids(matcher.select(cached))).toEqual(["b", "a", "c"]);
    });

    it("should sort empty values first in ascending order", () => {
        const matcher = createMatcher();
        matcher.updateFromQuery({ sort: { field: "savedOn", direction: "ASC" } }, ["a", "b"]);

        expect(ids(matcher.select([row("a", "1"), row("b")]))).toEqual(["b", "a"]);
    });

    it("should keep the server order while searching", () => {
        const matcher = createMatcher();
        matcher.updateFromQuery({ search: "hello", sort: { field: "savedOn", direction: "ASC" } }, [
            "c",
            "a",
            "b"
        ]);

        const cached = [row("a", "1"), row("b", "2"), row("c", "3"), row("x", "0")];

        expect(ids(matcher.select(cached))).toEqual(["c", "a", "b"]);
    });

    it("should read nested sort fields by path", () => {
        const matcher = createMatcher();
        matcher.updateFromQuery({ sort: { field: "values.title", direction: "ASC" } }, ["a", "b"]);

        const cached: Row[] = [
            { id: "b", folderId: "root", values: { title: "Beta" } },
            { id: "a", folderId: "root", values: { title: "Alpha" } }
        ];

        expect(ids(matcher.select(cached))).toEqual(["a", "b"]);
    });

    it("should use a custom sort value getter", () => {
        const matcher = createMatcher({
            getSortValue: (item, field) => (field === "title" ? item.values?.title : undefined)
        });
        matcher.updateFromQuery({ sort: { field: "title", direction: "DESC" } }, ["a", "b"]);

        const cached: Row[] = [
            { id: "a", folderId: "root", values: { title: "Alpha" } },
            { id: "b", folderId: "root", values: { title: "Beta" } }
        ];

        expect(ids(matcher.select(cached))).toEqual(["b", "a"]);
    });

    it("should put items the server did not return after the server's items among equal values", () => {
        const matcher = createMatcher();
        matcher.updateFromQuery(
            { sort: { field: "savedOn", direction: "DESC" } },
            ["b", "a"],
            true
        );

        // "x" and "y" were cached by another view and tie with the loaded items.
        const cached = [row("x", "1"), row("a", "1"), row("y", "1"), row("b", "1")];

        // Server items come first, in server order, and the tied leftovers are cut off
        // together with everything else past the last loaded item.
        expect(ids(matcher.select(cached))).toEqual(["b", "a"]);
    });
});
