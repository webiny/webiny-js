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

    it("tells the model to show no text the section does not have", () => {
        expect(prompt).toContain("Show no other text.");
    });

    it("states the section's geometry and each picture's role and tone", () => {
        const withLayout = buildComponentPrompt(
            {
                ...footer,
                layout: {
                    width: 1440,
                    height: 70,
                    elements: [
                        {
                            kind: "image",
                            label: '"Freehill Street Lofts"',
                            x: 30,
                            y: 15,
                            width: 378,
                            height: 120
                        }
                    ],
                    omitted: 0
                },
                images: [
                    {
                        url: "https://res.cloudinary.com/g5-assets-cld/image/upload/Logo_xkmkne.png",
                        role: "inline",
                        width: 378,
                        height: 120,
                        coverage: 0.45,
                        tone: "light",
                        transparent: true
                    }
                ]
            } as unknown as PlannedComponent,
            new Map()
        );
        expect(withLayout).toContain("The section measures 1440x70px.");
        expect(withLayout).toContain('- image "Freehill Street Lofts" at 30,15 — 378x120');
        expect(withLayout).toContain(
            "light on a transparent background — it is invisible on a light surface"
        );
    });

    it("gives as defaults only the values the representative copy showed", () => {
        // Park City's Property Description: its own carousel photo, and a Neighborhood page photo.
        const withCopies = buildComponentPrompt(
            {
                ...footer,
                props: [
                    {
                        name: "images",
                        type: "Image",
                        array: true,
                        optional: false,
                        observedValues: [],
                        observedStructured: [
                            {
                                kind: "item",
                                fields: {
                                    src: { src: "https://cdn.example/GettyImages-172432728.jpg" }
                                },
                                member: 0
                            },
                            {
                                kind: "item",
                                fields: {
                                    src: { src: "https://cdn.example/GettyImages-1375934212.jpg" }
                                },
                                member: 1
                            }
                        ]
                    }
                ]
            } as unknown as PlannedComponent,
            new Map()
        );
        expect(withCopies).toContain("GettyImages-172432728");
        expect(withCopies).not.toContain("GettyImages-1375934212");
    });
    describe("background images", () => {
        const pattern =
            "https://g5-assets-cld-res.cloudinary.com/image/upload/q_auto,f_auto,c_fill,g_center,h_960,w_1600/v1773910860/uploads/Denver_Background_Tertiary_bnx4vk.png";
        const photo = "https://cs-cdn.realpage.com/CWS/2623272/images/154711922.jpg";
        const withBackgrounds = (backgroundImages: unknown[]) =>
            buildComponentPrompt(
                { ...footer, backgroundImages } as unknown as PlannedComponent,
                new Map()
            );

        it("words Park city's see-through pattern as drawn over the colour measured under it", () => {
            // As Plan now hands it over: measured from the file, and the colour taken where it is drawn.
            const prompt = withBackgrounds([
                {
                    url: pattern,
                    size: "cover",
                    position: "50% 50%",
                    repeat: "no-repeat",
                    area: 921600,
                    opacity: 0.12,
                    tone: "light",
                    under: { hex: "#f7f7f9", token: null }
                }
            ]);
            expect(prompt).toContain(
                "This section's background has a mostly see-through image drawn over a colour (about 12% opaque):"
            );
            expect(prompt).toContain(
                "Under it, paint #f7f7f9 (no theme variable is near this colour, use it directly), and set the image over it as a CSS background-image:"
            );
            expect(prompt).not.toContain("painted with an image, not a colour");
            expect(prompt).not.toContain("do not replace the\nimage with a flat background colour");
        });

        it("names no colour under a see-through image when none was measured", () => {
            const prompt = withBackgrounds([{ url: pattern, area: 921600, opacity: 0.12 }]);
            expect(prompt).toContain(
                "Paint the colour the reference image shows through it, and set the image over it as a"
            );
        });

        it("keeps the photograph wording for an opaque image, and for one that was not measured", () => {
            for (const opacity of [1, undefined]) {
                const prompt = withBackgrounds([
                    { url: photo, size: "cover", area: 1036800, ...(opacity ? { opacity } : {}) }
                ]);
                expect(prompt).toContain(
                    "This section's background is painted with an image, not a colour. Set it as a CSS"
                );
                expect(prompt).not.toContain("mostly see-through");
            }
        });
    });
});
