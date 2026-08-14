import { describe, expect, it } from "vitest";
import {
    clusterCountAt,
    leaderCluster,
    nearestPairSimilarity,
    sectionSimilarity
} from "./similarity.js";
import type { SectionShape, TypeNode } from "~/domain/artifacts.js";

const tree = (tag: string, children: TypeNode[] = []): TypeNode => ({ tag, children });

const shape = (
    typeTree: TypeNode,
    geometryClass = "full-cols1",
    tokens: string[] = []
): SectionShape => ({
    typeTree,
    geometryClass,
    tokens
});

const hero = () => shape(tree("section", [tree("h1"), tree("p"), tree("a")]));

describe("sectionSimilarity", () => {
    it("scores identical shapes 1", () => {
        expect(sectionSimilarity(hero(), hero())).toBe(1);
    });

    it("scores a small structural difference between exact and disjoint", () => {
        // Same section with one extra child: high but < 1.
        const withExtra = shape(tree("section", [tree("h1"), tree("p"), tree("a"), tree("img")]));
        const sim = sectionSimilarity(hero(), withExtra);
        expect(sim).toBeGreaterThan(0.7);
        expect(sim).toBeLessThan(1);
    });

    it("penalises a different geometry class", () => {
        const other = shape(tree("section", [tree("h1"), tree("p"), tree("a")]), "contained-cols3");
        // Same tree + tokens, different geometry → drops by the geometry weight (0.25).
        expect(sectionSimilarity(hero(), other)).toBeCloseTo(0.75, 5);
    });

    it("scores structurally unrelated sections low", () => {
        const footer = shape(tree("footer", [tree("ul", [tree("li"), tree("li")])]), "full-cols4");
        expect(sectionSimilarity(hero(), footer)).toBeLessThan(0.2);
    });

    it("ignores text/images (not part of the shape) — same tree scores 1", () => {
        expect(sectionSimilarity(hero(), hero())).toBe(1);
    });
});

describe("leaderCluster", () => {
    const heroA = { id: "a", shape: hero() };
    const heroB = { id: "b", shape: hero() };
    const footer = {
        id: "f",
        shape: shape(tree("footer", [tree("ul", [tree("li")])]), "full-cols4")
    };

    it("groups similar items and separates dissimilar ones at a mid threshold", () => {
        const groups = leaderCluster([heroA, heroB, footer], item => item.shape, 0.8);
        expect(groups).toHaveLength(2);
        expect(
            groups
                .find(g => g.length === 2)!
                .map(i => i.id)
                .sort()
        ).toEqual(["a", "b"]);
    });

    it("at threshold 1 groups only exact matches (the old exact-signature behaviour)", () => {
        const nearHero = {
            id: "n",
            shape: shape(tree("section", [tree("h1"), tree("p"), tree("a"), tree("span")]))
        };
        const groups = leaderCluster([heroA, nearHero], item => item.shape, 1);
        expect(groups).toHaveLength(2);
    });

    it("first item of a group is its representative (input order)", () => {
        const groups = leaderCluster([heroA, heroB], item => item.shape, 0.8);
        expect(groups[0][0].id).toBe("a");
    });
});

describe("clusterCountAt + nearestPairSimilarity", () => {
    // hero vs hero-with-an-extra-child scores ~0.88: separate at threshold 1, merged at 0.85.
    const withExtra = shape(tree("section", [tree("h1"), tree("p"), tree("a"), tree("img")]));
    const footer = shape(tree("footer", [tree("ul")]), "full-cols4");
    const shapes = [hero(), withExtra, footer];

    it("counts fewer clusters as the threshold drops", () => {
        expect(clusterCountAt(shapes, 1)).toBe(3);
        expect(clusterCountAt(shapes, 0.85)).toBe(2);
    });

    it("nearest pair is 1 when two identical shapes are present", () => {
        expect(nearestPairSimilarity([hero(), hero(), footer])).toBe(1);
    });
});
