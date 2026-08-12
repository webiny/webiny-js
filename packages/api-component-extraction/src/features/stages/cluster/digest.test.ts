import { describe, expect, it } from "vitest";
import { descriptiveName, sectionDigest } from "./digest.js";
import type { Box, CapturedNode } from "~/domain/artifacts.js";

const box: Box = { x: 0, y: 0, width: 100, height: 100 };
const node = (tag: string, text?: string, children: CapturedNode[] = []): CapturedNode => ({
    tag,
    box,
    styles: {},
    ...(text ? { text } : {}),
    children
});

describe("sectionDigest", () => {
    it("counts headings, images and links and collects deduped text", () => {
        const section = node("section", undefined, [
            node("h2", "Ready to get started?"),
            node("p", "Join thousands of teams."),
            node("img"),
            node("a", "Get Started"),
            node("a", "Get Started") // duplicate text collapses
        ]);
        const digest = sectionDigest(section);
        expect(digest.headingCount).toBe(1);
        expect(digest.imageCount).toBe(1);
        expect(digest.linkCount).toBe(2);
        expect(digest.texts).toEqual([
            "Ready to get started?",
            "Join thousands of teams.",
            "Get Started"
        ]);
        expect(digest.structure.startsWith("section>")).toBe(true);
    });
});

describe("descriptiveName", () => {
    it("uses the first text, falling back for media-only sections", () => {
        expect(
            descriptiveName(sectionDigest(node("section", undefined, [node("h2", "Pricing")])))
        ).toBe("Pricing");
        expect(
            descriptiveName(sectionDigest(node("section", undefined, [node("img"), node("img")])))
        ).toBe("Media section");
    });
});
