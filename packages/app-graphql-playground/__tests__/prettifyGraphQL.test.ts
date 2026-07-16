import { describe, it, expect } from "vitest";
import { prettifyGraphQL } from "../src/presentation/Playground/prettifyGraphQL";

describe("prettifyGraphQL", () => {
    it("should format a compact query", () => {
        const input = "{listAuthors{data{id name}}}";
        const result = prettifyGraphQL(input);

        expect(result).toContain("listAuthors");
        expect(result).toContain("id");
        expect(result).toContain("name");
        expect(result).not.toBe(input);
    });

    it("should preserve a standalone comment before a field", () => {
        const input = [
            "query {",
            "  # Fetch the author's name.",
            "  listAuthors {",
            "    data {",
            "      id",
            "      name",
            "    }",
            "  }",
            "}"
        ].join("\n");

        const result = prettifyGraphQL(input);

        expect(result).toContain("# Fetch the author's name.");
        expect(result).toContain("listAuthors");
    });

    it("should preserve a trailing comment on the same line", () => {
        const input = [
            "query {",
            "  listAuthors {",
            "    data {",
            "      id # Primary key.",
            "      name",
            "    }",
            "  }",
            "}"
        ].join("\n");

        const result = prettifyGraphQL(input);
        const lines = result.split("\n");
        const idLine = lines.find(l => l.includes("id"));

        expect(idLine).toContain("id");
        expect(idLine).toContain("# Primary key.");
    });

    it("should preserve a top-level comment before the query", () => {
        const input = [
            "# Top-level comment.",
            "query {",
            "  listAuthors {",
            "    data {",
            "      id",
            "    }",
            "  }",
            "}"
        ].join("\n");

        const result = prettifyGraphQL(input);

        expect(result).toContain("# Top-level comment.");

        const commentIdx = result.indexOf("# Top-level comment.");
        const braceIdx = result.indexOf("{");
        expect(commentIdx).toBeLessThan(braceIdx);
    });

    it("should preserve multiple consecutive standalone comments", () => {
        const input = [
            "query {",
            "  # First comment.",
            "  # Second comment.",
            "  listAuthors {",
            "    data {",
            "      id",
            "    }",
            "  }",
            "}"
        ].join("\n");

        const result = prettifyGraphQL(input);

        expect(result).toContain("# First comment.");
        expect(result).toContain("# Second comment.");

        const firstIdx = result.indexOf("# First comment.");
        const secondIdx = result.indexOf("# Second comment.");
        const listIdx = result.indexOf("listAuthors");

        expect(firstIdx).toBeLessThan(secondIdx);
        expect(secondIdx).toBeLessThan(listIdx);
    });

    it("should keep a trailing comment after an opening brace", () => {
        const input = "query { # inside\n  listAuthors {\n    data {\n      id\n    }\n  }\n}";
        const result = prettifyGraphQL(input);
        const lines = result.split("\n");

        const braceLine = lines.find(l => l.trimStart().startsWith("{"));
        expect(braceLine).toContain("# inside");
    });

    it("should indent standalone comments to match the anchor line", () => {
        const input = [
            "{",
            "  # Describes the authors query.",
            "  listAuthors {",
            "    data {",
            "      id",
            "    }",
            "  }",
            "}"
        ].join("\n");

        const result = prettifyGraphQL(input);
        const lines = result.split("\n");

        const commentLine = lines.find(l => l.includes("# Describes"));
        const anchorLine = lines.find(l => l.includes("listAuthors"));

        expect(commentLine).toBeDefined();
        expect(anchorLine).toBeDefined();

        const commentIndent = commentLine!.match(/^(\s*)/)?.[1] || "";
        const anchorIndent = anchorLine!.match(/^(\s*)/)?.[1] || "";

        expect(commentIndent).toBe(anchorIndent);
    });

    it("should handle a query with no comments", () => {
        const input = [
            "query {",
            "  listAuthors {",
            "    data {",
            "      id",
            "    }",
            "  }",
            "}"
        ].join("\n");

        const result = prettifyGraphQL(input);

        expect(result).toContain("listAuthors");
        expect(result).not.toContain("#");
    });

    it("should throw on invalid GraphQL", () => {
        expect(() => prettifyGraphQL("not valid graphql {{{")).toThrow();
    });
});
