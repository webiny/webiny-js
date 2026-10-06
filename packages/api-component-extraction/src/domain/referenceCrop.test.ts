import { describe, it, expect } from "vitest";
import type { ClusterMember } from "./artifacts.js";
import { chooseReferenceCrop, referenceMemberOf } from "./referenceCrop.js";

const member = (
    url: string,
    sectionIndex: number,
    cropRef: string,
    cropWarning?: ClusterMember["cropWarning"]
): ClusterMember => ({
    url,
    sectionIndex,
    signature: `sig-${url}-${sectionIndex}`,
    cropRef,
    screenshotRef: `${url}/screenshot.png`,
    box: { x: 0, y: sectionIndex * 100, width: 1440, height: 100 },
    ...(cropWarning ? { cropWarning } : {})
});

describe("chooseReferenceCrop", () => {
    it("uses the representative's crop when it is whole", () => {
        const crop = chooseReferenceCrop([member("/a", 1, "crop-a"), member("/b", 2, "crop-b")]);
        expect(crop.cropRef).toBe("crop-a");
        expect(crop.member).toEqual({ url: "/a", sectionIndex: 1 });
        expect(crop.screenshotRef).toBe("/a/screenshot.png");
        expect(crop.box).toEqual({ x: 0, y: 100, width: 1440, height: 100 });
    });

    it("stands in another member when the representative has no crop", () => {
        const crop = chooseReferenceCrop([
            member("/a", 1, "", { kind: "outside-screenshot", visibleFraction: 0 }),
            member("/b", 2, "crop-b")
        ]);
        expect(crop.cropRef).toBe("crop-b");
        expect(crop.member).toEqual({ url: "/b", sectionIndex: 2 });
    });

    it("prefers a whole crop over a partial one, and a partial one over none", () => {
        const partial = { kind: "partially-outside" as const, visibleFraction: 0.7 };
        expect(
            chooseReferenceCrop([member("/a", 1, "crop-a", partial), member("/b", 2, "crop-b")])
                .cropRef
        ).toBe("crop-b");
        expect(
            chooseReferenceCrop([
                member("/a", 1, "", { kind: "outside-screenshot", visibleFraction: 0 }),
                member("/b", 2, "crop-b", partial)
            ]).cropRef
        ).toBe("crop-b");
    });

    it("keeps the representative with no crop when no member has one", () => {
        const crop = chooseReferenceCrop([
            member("/a", 1, "", { kind: "outside-screenshot", visibleFraction: 0 }),
            member("/b", 2, "", { kind: "no-screenshot", visibleFraction: 0 })
        ]);
        expect(crop.cropRef).toBe("");
        expect(crop.member).toEqual({ url: "/a", sectionIndex: 1 });
    });
});

describe("referenceMemberOf", () => {
    it("finds the member a crop names", () => {
        const members = [member("/a", 1, "crop-a"), member("/b", 2, "crop-b")];
        const crop = chooseReferenceCrop([members[0]]);
        expect(
            referenceMemberOf({ ...crop, member: { url: "/b", sectionIndex: 2 } }, members)
        ).toBe(members[1]);
    });

    it("finds nothing for a crop recorded before members were named", () => {
        expect(
            referenceMemberOf(
                { screenshotRef: "", box: { x: 0, y: 0, width: 0, height: 0 }, cropRef: "c" },
                [member("/a", 1, "crop-a")]
            )
        ).toBeUndefined();
    });
});
