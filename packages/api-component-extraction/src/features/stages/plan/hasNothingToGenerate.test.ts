import { describe, expect, it } from "vitest";
import { hasNothingToGenerate } from "./hasNothingToGenerate.js";
import type { Cluster, SectionDigest } from "~/domain/artifacts.js";

const digest = (over: Partial<SectionDigest> = {}): SectionDigest => ({
    structure: "div>div>div",
    texts: [],
    imageCount: 0,
    linkCount: 0,
    headingCount: 0,
    ...over
});

const cluster = (over: Partial<Cluster> = {}): Cluster =>
    ({
        signature: "sig",
        members: [],
        representative: {},
        digest: digest(),
        observedTexts: [],
        representativeCrop: {},
        ...over
    }) as unknown as Cluster;

describe("hasNothingToGenerate", () => {
    /*
     * The 2424tulane case: a spacer promoted as "Empty Container / Spacer", visible in the customer's
     * library. Generate builds it happily and every validator passes, because there is nothing to
     * preserve, conform to or bind.
     */
    it("recognises a spacer with no text, images or links", () => {
        expect(hasNothingToGenerate(cluster())).toBe(true);
    });

    it("keeps a cluster that carries text", () => {
        expect(hasNothingToGenerate(cluster({ observedTexts: ["Resident Portal"] }))).toBe(false);
    });

    it("keeps a cluster whose only content is an image", () => {
        expect(hasNothingToGenerate(cluster({ digest: digest({ imageCount: 1 }) }))).toBe(false);
    });

    it("keeps a cluster whose only content is a destination", () => {
        expect(hasNothingToGenerate(cluster({ digest: digest({ linkCount: 1 }) }))).toBe(false);
    });

    /*
     * Judged across every member, not the representative alone — otherwise a cluster whose exemplar
     * happens to be the bare one is discarded while its siblings carry the content.
     */
    it("keeps a cluster whose representative is bare but whose members are not", () => {
        const value = cluster({
            members: [
                { digest: digest() },
                { digest: digest({ texts: ["Apply Now"] }) }
            ] as unknown as Cluster["members"]
        });

        expect(hasNothingToGenerate(value)).toBe(false);
    });

    it("is not fooled by whitespace-only text", () => {
        expect(hasNothingToGenerate(cluster({ observedTexts: ["   ", "\n"] }))).toBe(true);
    });

    it("keeps a cluster from an artifact written before members carried digests", () => {
        const value = cluster({
            digest: digest({ texts: ["Contact Us"] }),
            members: [{}, {}] as unknown as Cluster["members"]
        });

        expect(hasNothingToGenerate(value)).toBe(false);
    });
});
