import { describe, expect, it } from "vitest";
import { createNamespaceFilter, parseNamespaceHeader } from "../matchNamespace.js";

describe("parseNamespaceHeader", () => {
    it("should not start a session when the header is absent or empty", () => {
        expect(parseNamespaceHeader(undefined)).toEqual([]);
        expect(parseNamespaceHeader("")).toEqual([]);
        expect(parseNamespaceHeader("   ")).toEqual([]);
    });

    it("should treat the truthy shorthands as capture-all", () => {
        expect(parseNamespaceHeader("1")).toEqual(["*"]);
        expect(parseNamespaceHeader("true")).toEqual(["*"]);
        expect(parseNamespaceHeader("*")).toEqual(["*"]);
    });

    it("should trim tokens, since duplicate headers arrive comma-joined with spaces", () => {
        expect(parseNamespaceHeader("cms.os.*, fm.*")).toEqual(["cms.os.*", "fm.*"]);
    });

    it("should accept the array form produced by app.inject", () => {
        expect(parseNamespaceHeader(["cms.os.*", "fm.*"])).toEqual(["cms.os.*", "fm.*"]);
    });
});

describe("createNamespaceFilter", () => {
    it("should match everything for the wildcard", () => {
        const filter = createNamespaceFilter(["*"]);

        expect(filter.matches("cms.os.list")).toBe(true);
        expect(filter.matches("core.anything")).toBe(true);
    });

    it("should match a prefix glob across dots", () => {
        const filter = createNamespaceFilter(["cms.*"]);

        expect(filter.matches("cms.os.list")).toBe(true);
        expect(filter.matches("fm.file.get")).toBe(false);
    });

    it("should exclude rather than invert on negation", () => {
        const filter = createNamespaceFilter(["*", "!cms.os.*"]);

        expect(filter.matches("cms.os.list")).toBe(false);
        expect(filter.matches("fm.file.get")).toBe(true);
    });

    it("should require at least one positive match", () => {
        const filter = createNamespaceFilter(["!cms.os.*"]);

        expect(filter.matches("fm.file.get")).toBe(false);
    });
});
