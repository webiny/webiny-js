import { describe, expect, it } from "vitest";
import type { PlannedComponent } from "~/domain/artifacts.js";
import { buildComponentPrompt } from "./componentGeneration.js";

// 71 Westland's footer, as Plan now hands it over: a logo and a badge no prop took, two icon links.
const footer = {
    signature: "sig",
    name: "Property Footer",
    type: "footer",
    props: [],
    tokenBindings: [],
    members: [],
    representativeCrop: {
        screenshotRef: "",
        box: { x: 0, y: 0, width: 1440, height: 420 },
        cropRef: ""
    },
    sourceTexts: [],
    clusterTexts: [],
    unboundImages: [
        {
            url: "https://g5-assets-cld-res.cloudinary.com/uploads/Peabody-Properties-white_111_yzgkhs_fjr3nv_kuw4hn.png",
            alt: "Peabody Properties, Inc.",
            width: 150,
            height: 81
        }
    ],
    icons: [
        {
            label: "Visit Facebook page",
            href: "https://www.facebook.com/profile.php?id=100077057145960#"
        },
        { label: "Google this business" }
    ]
} as unknown as PlannedComponent;

describe("buildComponentPrompt", () => {
    const prompt = buildComponentPrompt(footer, new Map());

    it("names the images no prop carries, with their URL, size and alt", () => {
        expect(prompt).toContain(
            '- https://g5-assets-cld-res.cloudinary.com/uploads/Peabody-Properties-white_111_yzgkhs_fjr3nv_kuw4hn.png — 150x81px (alt: "Peabody Properties, Inc.")'
        );
    });

    it("names the icons to draw, with their links", () => {
        expect(prompt).toContain(
            "- Visit Facebook page -> https://www.facebook.com/profile.php?id=100077057145960#"
        );
        expect(prompt).toContain("- Google this business\n");
    });

    it("says how a file input's object is read wherever the section has images", () => {
        // The Freehill header's logo prop, as Plan bound it.
        const header = {
            ...footer,
            props: [
                {
                    name: "logo",
                    type: "Image",
                    array: false,
                    optional: false,
                    observedValues: [],
                    observedStructured: [
                        {
                            kind: "media",
                            src: "https://res.cloudinary.com/g5-assets-cld/image/upload/Logo_xkmkne.png",
                            alt: "Freehill Street Lofts"
                        }
                    ]
                }
            ]
        } as unknown as PlannedComponent;
        expect(buildComponentPrompt(header, new Map())).toContain(
            "a `logo` object with a file field `src` is read as `logo.src.url`, never `logo.src`."
        );
    });
});
