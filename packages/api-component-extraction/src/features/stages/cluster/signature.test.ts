import { describe, expect, it } from "vitest";
import { structuralSignature } from "./signature.js";
import type { SectionShape, TypeNode } from "~/domain/artifacts.js";

const tree: TypeNode = {
    tag: "section",
    children: [
        { tag: "h2", children: [] },
        { tag: "p", children: [] }
    ]
};

const shape = (overrides: Partial<SectionShape> = {}): SectionShape => ({
    typeTree: tree,
    geometryClass: "full-width",
    tokens: ["color.brand.primary", "space.lg"],
    ...overrides
});

describe("structuralSignature", () => {
    it("is a 64-char hex SHA-256 digest", () => {
        expect(structuralSignature(shape())).toMatch(/^[0-9a-f]{64}$/);
    });

    it("is stable for the same shape", () => {
        expect(structuralSignature(shape())).toBe(structuralSignature(shape()));
    });

    it("ignores token order", () => {
        const a = structuralSignature(shape({ tokens: ["space.lg", "color.brand.primary"] }));
        const b = structuralSignature(shape({ tokens: ["color.brand.primary", "space.lg"] }));
        expect(a).toBe(b);
    });

    it("changes when the type tree shape changes", () => {
        const other: TypeNode = { tag: "section", children: [{ tag: "h2", children: [] }] };
        expect(structuralSignature(shape())).not.toBe(
            structuralSignature(shape({ typeTree: other }))
        );
    });

    it("changes when the geometry class changes", () => {
        expect(structuralSignature(shape())).not.toBe(
            structuralSignature(shape({ geometryClass: "two-column" }))
        );
    });

    it("changes when the token set changes", () => {
        expect(structuralSignature(shape())).not.toBe(
            structuralSignature(shape({ tokens: ["color.brand.primary"] }))
        );
    });
});
