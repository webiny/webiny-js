import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { CapturedNode } from "~/domain/artifacts.js";
import { fingerprintDepth, firstContentDepth, sectionShape, toTypeTree } from "./sectionShape.js";
import { sectionSimilarity } from "./similarity.js";
import { structuralSignature } from "./signature.js";

// Real captured sections, pruned to what the fingerprint reads: the check run's 2424 Tulane carousel and
// two sections it was clustered with, and two of 71 Westland's centred intros (one template).
const sections = JSON.parse(
    readFileSync(new URL("./__fixtures__/fingerprint-sections.json", import.meta.url), "utf8")
) as Record<string, CapturedNode>;
const EMPTY = { colorHexToPath: new Map<string, string>() };
const shape = (name: string) => sectionShape(sections[name], 1440, EMPTY);
const legacyShape = (name: string) => ({ ...shape(name), typeTree: toTypeTree(sections[name]) });
const THRESHOLD = 0.85;

describe("the cluster fingerprint", () => {
    it("reaches past the wrapper stack to the section's content", () => {
        expect(firstContentDepth(sections["tulane-carousel"])).toBeGreaterThanOrEqual(8);
        expect(fingerprintDepth(sections["tulane-carousel"])).toBeGreaterThan(6);
    });

    it("no longer reads a carousel and a tour form as the same section", () => {
        // Under the depth-6 fingerprint all three were identical wrapper stacks.
        expect(
            sectionSimilarity(legacyShape("tulane-carousel"), legacyShape("tulane-tour-form"))
        ).toBeGreaterThanOrEqual(THRESHOLD);
        expect(sectionSimilarity(shape("tulane-carousel"), shape("tulane-tour-form"))).toBeLessThan(
            THRESHOLD
        );
        expect(
            sectionSimilarity(shape("tulane-carousel"), shape("tulane-apply-hero"))
        ).toBeLessThan(THRESHOLD);
    });

    it("keeps one template together whatever its content length", () => {
        expect(
            sectionSimilarity(shape("westland-intro-home"), shape("westland-intro-amenities"))
        ).toBeGreaterThanOrEqual(THRESHOLD);
    });

    it("keeps the previous signature computable, for overrides recorded under it", () => {
        expect(structuralSignature(legacyShape("tulane-carousel"))).not.toBe(
            structuralSignature(shape("tulane-carousel"))
        );
    });
});
