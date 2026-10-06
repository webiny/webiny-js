import { describe, it, expect } from "vitest";
import type { ClusterMember } from "~/domain/artifacts.js";
import { referenceTexts } from "./referenceTexts.js";

const member = (url: string, texts: string[]): ClusterMember => ({
    url,
    sectionIndex: 0,
    signature: `sig-${url}`,
    cropRef: `crop-${url}`,
    digest: { structure: "section", texts, imageCount: 0, linkCount: 0, headingCount: 0 }
});

const box = { x: 0, y: 0, width: 1440, height: 400 };

describe("referenceTexts", () => {
    it("takes the representative's text when its crop is the reference", () => {
        const representative = member("/a", ["Welcome to A"]);
        expect(
            referenceTexts({
                representative,
                members: [representative, member("/b", ["Welcome to B"])],
                observedTexts: ["Welcome to A", "Welcome to B"],
                representativeCrop: {
                    screenshotRef: "",
                    box,
                    cropRef: "crop-/a",
                    member: { url: "/a", sectionIndex: 0 }
                }
            })
        ).toEqual(["Welcome to A"]);
    });

    it("follows the picture to the member standing in for the representative", () => {
        const representative = member("/a", ["Welcome to A"]);
        const standIn = member("/b", ["Welcome to B"]);
        expect(
            referenceTexts({
                representative,
                members: [representative, standIn],
                observedTexts: ["Welcome to A", "Welcome to B"],
                representativeCrop: {
                    screenshotRef: "",
                    box,
                    cropRef: "crop-/b",
                    member: { url: "/b", sectionIndex: 0 }
                }
            })
        ).toEqual(["Welcome to B"]);
    });

    it("uses the representative for a crop recorded before members were named", () => {
        const representative = member("/a", ["Welcome to A"]);
        expect(
            referenceTexts({
                representative,
                members: [representative],
                observedTexts: ["Welcome to A"],
                representativeCrop: { screenshotRef: "", box, cropRef: "crop-/a" }
            })
        ).toEqual(["Welcome to A"]);
    });

    it("falls back to the cluster's text when the reference member recorded none", () => {
        const representative = member("/a", []);
        expect(
            referenceTexts({
                representative,
                members: [representative],
                observedTexts: ["From another member"],
                representativeCrop: {
                    screenshotRef: "",
                    box,
                    cropRef: "crop-/a",
                    member: { url: "/a", sectionIndex: 0 }
                }
            })
        ).toEqual(["From another member"]);
    });
});
