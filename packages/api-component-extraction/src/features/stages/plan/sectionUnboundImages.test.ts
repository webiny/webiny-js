import { describe, expect, it } from "vitest";
import type { CapturedNode, ComponentProp } from "~/domain/artifacts.js";
import { sectionUnboundImages } from "./sectionUnboundImages.js";

// Shaped on 71 Westland's captured footer: a bound social row, the Peabody logo the contract left out,
// a fixed chat launcher, and a sub-glyph spacer.
const node = (
    tag: string,
    box: CapturedNode["box"],
    extra: Partial<CapturedNode> = {}
): CapturedNode => ({
    tag,
    box,
    styles: {},
    children: [],
    ...extra
});

const footer = node(
    "footer",
    { x: 0, y: 1780, width: 1440, height: 420 },
    {
        children: [
            node(
                "img",
                { x: 645, y: 1937, width: 150, height: 81 },
                {
                    src: "https://g5-assets-cld-res.cloudinary.com/uploads/Peabody-Properties-white_111_yzgkhs_fjr3nv_kuw4hn.png",
                    alt: "Peabody Properties, Inc."
                }
            ),
            node(
                "img",
                { x: 1278, y: 2128, width: 24, height: 24 },
                {
                    src: "https://g5-assets-cld-res.cloudinary.com/uploads/FHEO-icon_qc8lqr_m6rnto.png",
                    alt: "Rental assistance website (opens in a new tab)"
                }
            ),
            node(
                "img",
                { x: 10, y: 2100, width: 8, height: 8 },
                { src: "https://example.com/dot.png" }
            ),
            node(
                "div",
                { x: 1300, y: 800, width: 60, height: 60 },
                {
                    styles: { position: "fixed" },
                    children: [
                        node(
                            "img",
                            { x: 1300, y: 800, width: 60, height: 60 },
                            { src: "https://example.com/chat.png" }
                        )
                    ]
                }
            )
        ]
    }
);

const props: ComponentProp[] = [
    {
        name: "badge",
        type: "Image",
        array: false,
        optional: false,
        observedValues: [],
        observedStructured: [
            {
                kind: "media",
                src: "https://g5-assets-cld-res.cloudinary.com/uploads/FHEO-icon_qc8lqr_m6rnto.png"
            }
        ]
    } as ComponentProp
];

describe("sectionUnboundImages", () => {
    it("names the images the props did not take, with their size and alt", () => {
        expect(sectionUnboundImages(footer, props)).toEqual([
            {
                url: "https://g5-assets-cld-res.cloudinary.com/uploads/Peabody-Properties-white_111_yzgkhs_fjr3nv_kuw4hn.png",
                alt: "Peabody Properties, Inc.",
                width: 150,
                height: 81
            }
        ]);
    });

    it("names every image when no prop carries any", () => {
        expect(sectionUnboundImages(footer, []).map(image => image.width)).toEqual([150, 24]);
    });
});
