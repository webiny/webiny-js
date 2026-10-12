import { describe, expect, it } from "vitest";
import type { CapturedNode } from "@webiny/api-component-extraction/domain/artifacts.js";
import type { ComponentManifest } from "@webiny/website-builder-sdk";
import { deriveCompositeInputs } from "./deriveCompositeInputs.js";

const SOURCE_URL = "https://www.webiny.com/";

const box = { x: 0, y: 0, width: 100, height: 20 };

const node = (
    tag: string,
    extra: Partial<CapturedNode> = {},
    children: CapturedNode[] = []
): CapturedNode => ({ tag, box, styles: {}, children, ...extra }) as CapturedNode;

const link = (text: string, href: string): CapturedNode =>
    node("li", {}, [node("a", { text, href })]);

const column = (heading: string, links: [string, string][]): CapturedNode =>
    node("div", {}, [
        node("h3", { text: heading }),
        node(
            "ul",
            {},
            links.map(([text, href]) => link(text, href))
        )
    ]);

/**
 * The real captured shape of webiny.com's footer: `footer > div > div > five column divs`, each an
 * `h3` heading plus a `ul` of `li > a`, and two further rows beside the columns. Trimmed in the
 * number of links, identical in structure.
 */
const footerTree = (): CapturedNode =>
    node("footer", {}, [
        node("div", {}, [
            node("div", {}, [
                column("Product", [
                    ["Headless CMS", "https://www.webiny.com/headless-cms"],
                    ["Website Builder", "https://www.webiny.com/website-builder"]
                ]),
                column("Developers", [
                    ["Learn Webiny Course", "https://www.webiny.com/learn"],
                    ["Reference docs", "https://www.webiny.com/docs"]
                ]),
                /*
                 * Deliberately more links than there are columns. The live run failed exactly here:
                 * selecting by group size picked this column's list items as "the columns", so the
                 * headings came back as link labels. Any fixture whose widest column is smaller than
                 * the column count cannot catch it.
                 */
                column("Resources", [
                    ["Partners", "https://www.webiny.com/partners"],
                    ["Developer Community", "https://www.webiny.com/slack"],
                    ["Blog", "https://www.webiny.com/blog"],
                    ["Guides", "https://www.webiny.com/guides"]
                ]),
                column("Legal", [["Privacy", "https://www.webiny.com/privacy-policy"]])
            ])
        ]),
        node("div", {}, [
            node("ul", {}, [
                link("X", "https://x.com/WebinyCMS"),
                link("LinkedIn", "https://www.linkedin.com/company/webiny")
            ])
        ]),
        node("div", {}, [node("p", { text: "© 2026 Webiny Ltd." })])
    ]);

/** The footer manifest the generator actually produced, including `url` typed as plain text. */
const footerManifest = (): ComponentManifest =>
    ({
        name: "Custom/Footer",
        tags: [],
        inputs: [
            { name: "brandHeading", type: "text" },
            {
                name: "columns",
                type: "object",
                list: true,
                fields: [
                    { name: "heading", type: "text" },
                    {
                        name: "links",
                        type: "object",
                        list: true,
                        fields: [
                            { name: "label", type: "text" },
                            { name: "url", type: "text" },
                            { name: "newTab", type: "boolean" }
                        ]
                    }
                ]
            },
            {
                name: "socialLinks",
                type: "object",
                list: true,
                fields: [
                    { name: "label", type: "text" },
                    { name: "url", type: "text" },
                    { name: "newTab", type: "boolean" }
                ]
            },
            { name: "legalText", type: "lexical" }
        ]
    }) as unknown as ComponentManifest;

describe("deriveCompositeInputs — the real footer", () => {
    const derived = deriveCompositeInputs({
        node: footerTree(),
        manifest: footerManifest(),
        sourceUrl: SOURCE_URL
    });
    const columns = derived.columns as {
        heading: string;
        links: { label: string; url: string }[];
    }[];

    it("finds the column containers, not the footer's rows or a column's list items", () => {
        expect(columns).toHaveLength(4);
        expect(columns.map(c => c.heading)).toEqual([
            "Product",
            "Developers",
            "Resources",
            "Legal"
        ]);
    });

    it("carries every destination, paired with its own label", () => {
        expect(columns[0]?.links).toEqual([
            { label: "Headless CMS", url: "https://www.webiny.com/headless-cms" },
            { label: "Website Builder", url: "https://www.webiny.com/website-builder" }
        ]);
        expect(columns[3]?.links).toEqual([
            { label: "Privacy", url: "https://www.webiny.com/privacy-policy" }
        ]);
        // The widest column: the one that used to be mistaken for the column list itself.
        expect(columns[2]?.links.map(l => l.label)).toEqual([
            "Partners",
            "Developer Community",
            "Blog",
            "Guides"
        ]);
    });

    it("puts every captured link on the page exactly once", () => {
        const derivedHrefs = columns
            .flatMap(c => c.links.map(l => l.url))
            .concat(((derived.socialLinks as { url: string }[]) ?? []).map(l => l.url));

        expect(derivedHrefs).toHaveLength(11);
        expect(new Set(derivedHrefs).size).toBe(11);
        expect(derivedHrefs).not.toContain("#");
    });

    it("gives socialLinks the social row, not the widest column of nav links", () => {
        const social = derived.socialLinks as { label: string; url: string }[];
        expect(social).toEqual([
            { label: "X", url: "https://x.com/WebinyCMS" },
            { label: "LinkedIn", url: "https://www.linkedin.com/company/webiny" }
        ]);
    });

    it("leaves a field with no captured source unset, so the component's default stands", () => {
        expect(columns[0]?.links[0]).not.toHaveProperty("newTab");
    });

    it("does not touch scalar inputs — those come from the aligned text derivation", () => {
        expect(derived).not.toHaveProperty("brandHeading");
        expect(derived).not.toHaveProperty("legalText");
    });
});

describe("deriveCompositeInputs — other shapes", () => {
    it("derives a single composite from the section itself", () => {
        const section = node("section", {}, [
            node("h2", { text: "Ready to build?" }),
            node("a", { text: "Get started", href: "https://site/start" })
        ]);
        const manifest = {
            name: "Custom/Cta",
            tags: [],
            inputs: [
                {
                    name: "cta",
                    type: "object",
                    fields: [
                        { name: "label", type: "text" },
                        { name: "url", type: "text" }
                    ]
                }
            ]
        } as unknown as ComponentManifest;

        // The CTA's own label, not the section heading above it: a single composite is read from
        // its own container, which for a link is the anchor carrying both halves.
        expect(
            deriveCompositeInputs({ node: section, manifest, sourceUrl: SOURCE_URL }).cta
        ).toEqual({
            label: "Get started",
            url: "https://site/start"
        });
    });

    it("derives a list of cards with an image and its alt text", () => {
        const card = (title: string, src: string, alt: string) =>
            node("article", {}, [node("h3", { text: title }), node("img", { src, alt })]);
        const section = node("section", {}, [
            node("div", {}, [card("Fast", "/a.png", "Speed"), card("Secure", "/b.png", "Lock")])
        ]);
        const manifest = {
            name: "Custom/Cards",
            tags: [],
            inputs: [
                {
                    name: "cards",
                    type: "object",
                    list: true,
                    fields: [
                        { name: "title", type: "text" },
                        { name: "image", type: "file" },
                        { name: "imageAlt", type: "text" }
                    ]
                }
            ]
        } as unknown as ComponentManifest;

        // A `file` input gets the object shape unless the component's source says it reads a bare
        // string: a component that dereferences `.url` renders nothing at all from a plain string.
        expect(
            deriveCompositeInputs({ node: section, manifest, sourceUrl: SOURCE_URL }).cards
        ).toEqual([
            // With the size each picture is drawn at, from its box (quality.image-size).
            { title: "Fast", image: { url: "/a.png", width: box.width, height: box.height }, imageAlt: "Speed" },
            { title: "Secure", image: { url: "/b.png", width: box.width, height: box.height }, imageAlt: "Lock" }
        ]);
    });

    it("gives a file input the bare string when the component reads it that way", () => {
        const card = (title: string, src: string, alt: string) =>
            node("article", {}, [node("h3", { text: title }), node("img", { src, alt })]);
        const section = node("section", {}, [node("div", {}, [card("Fast", "/a.png", "Speed")])]);
        const manifest = {
            name: "Custom/Cards",
            tags: [],
            inputs: [
                {
                    name: "cards",
                    type: "object",
                    list: true,
                    fields: [
                        { name: "title", type: "text" },
                        { name: "image", type: "file" }
                    ]
                }
            ]
        } as unknown as ComponentManifest;

        expect(
            deriveCompositeInputs({
                node: section,
                manifest,
                sourceUrl: SOURCE_URL,
                fileShapes: new Map([["image", "string" as const]])
            }).cards
        ).toEqual([{ title: "Fast", image: "/a.png" }]);
    });

    it("leaves a text input named like an image as a string", () => {
        // `isImageField` matches on name as well as type, so this is the case that must not be
        // wrapped: `imageUrl` is text, and the component has always been handed a string.
        const section = node("section", {}, [
            node("div", {}, [node("article", {}, [node("img", { src: "/a.png", alt: "Speed" })])])
        ]);
        const manifest = {
            name: "Custom/Cards",
            tags: [],
            inputs: [
                {
                    name: "cards",
                    type: "object",
                    list: true,
                    fields: [{ name: "imageUrl", type: "text" }]
                }
            ]
        } as unknown as ComponentManifest;

        const cards = deriveCompositeInputs({
            node: section,
            manifest,
            sourceUrl: SOURCE_URL
        }).cards as Record<string, unknown>[];

        expect(typeof cards?.[0]?.imageUrl).toBe("string");
    });

    it("empties a list it could not derive when the default would render dead links", () => {
        // The real case: a footer whose social links are one of its columns, so `socialLinks` has no
        // source and the model's `href: "#"` examples would otherwise reach the page.
        const section = node("section", {}, [node("p", { text: "No links here." })]);
        const manifest = {
            name: "Custom/Footer",
            tags: [],
            inputs: [
                {
                    name: "socialLinks",
                    type: "object",
                    list: true,
                    fields: [
                        { name: "label", type: "text" },
                        { name: "url", type: "text" }
                    ]
                }
            ],
            defaults: { inputs: { socialLinks: [{ label: "X", url: "#" }] } }
        } as unknown as ComponentManifest;

        expect(
            deriveCompositeInputs({ node: section, manifest, sourceUrl: SOURCE_URL }).socialLinks
        ).toEqual([]);
    });

    it("leaves an illustrative default alone when it carries no destinations", () => {
        const section = node("section", {}, [node("p", { text: "Prose only." })]);
        const manifest = {
            name: "Custom/Stats",
            tags: [],
            inputs: [
                {
                    name: "stats",
                    type: "object",
                    list: true,
                    fields: [
                        { name: "label", type: "text" },
                        { name: "value", type: "text" }
                    ]
                }
            ],
            defaults: { inputs: { stats: [{ label: "Uptime", value: "99.9%" }] } }
        } as unknown as ComponentManifest;

        expect(
            deriveCompositeInputs({ node: section, manifest, sourceUrl: SOURCE_URL })
        ).not.toHaveProperty("stats");
    });

    it("empties a list whose dead destinations are nested inside its items", () => {
        const section = node("section", {}, [node("p", { text: "Prose only." })]);
        const manifest = {
            name: "Custom/Footer",
            tags: [],
            inputs: [
                {
                    name: "columns",
                    type: "object",
                    list: true,
                    fields: [
                        { name: "heading", type: "text" },
                        {
                            name: "links",
                            type: "object",
                            list: true,
                            fields: [
                                { name: "label", type: "text" },
                                { name: "url", type: "text" }
                            ]
                        }
                    ]
                }
            ],
            defaults: {
                inputs: { columns: [{ heading: "Product", links: [{ label: "CMS", url: "#" }] }] }
            }
        } as unknown as ComponentManifest;

        expect(
            deriveCompositeInputs({ node: section, manifest, sourceUrl: SOURCE_URL }).columns
        ).toEqual([]);
    });

    it("returns nothing when the section has no matching structure", () => {
        const section = node("section", {}, [node("p", { text: "Just prose." })]);
        const manifest = {
            name: "Custom/Cards",
            tags: [],
            inputs: [
                {
                    name: "cards",
                    type: "object",
                    list: true,
                    fields: [
                        { name: "title", type: "text" },
                        { name: "url", type: "text" }
                    ]
                }
            ]
        } as unknown as ComponentManifest;

        expect(deriveCompositeInputs({ node: section, manifest, sourceUrl: SOURCE_URL })).toEqual(
            {}
        );
    });
});

describe("deriveCompositeInputs — credible destinations in generated defaults", () => {
    const section = () =>
        node("section", {}, [
            node("h2", { text: "Prose only." }),
            node("a", { text: "Real link", href: "https://www.webiny.com/pricing" })
        ]);

    const manifest = (defaultUrl: string): ComponentManifest =>
        ({
            name: "Custom/Nav",
            tags: [],
            inputs: [
                {
                    name: "extras",
                    type: "object",
                    list: true,
                    fields: [
                        { name: "label", type: "text" },
                        { name: "url", type: "text" },
                        { name: "note", type: "text" }
                    ]
                }
            ],
            defaults: { inputs: { extras: [{ label: "Book a demo", url: defaultUrl, note: "x" }] } }
        }) as unknown as ComponentManifest;

    const derive = (defaultUrl: string) =>
        deriveCompositeInputs({
            node: section(),
            manifest: manifest(defaultUrl),
            sourceUrl: SOURCE_URL
        }).extras;

    it("drops a relative default, which 404s on the migrated site", () => {
        // The case found on a real header: `/demo` looks live and goes nowhere.
        expect(derive("/demo")).toEqual([]);
    });

    it("drops an invented absolute URL on the source host", () => {
        expect(derive("https://www.webiny.com/demo")).toEqual([]);
    });

    it("keeps a destination that was actually captured from the section", () => {
        expect(derive("https://www.webiny.com/pricing")).toBeUndefined();
    });

    it("keeps an absolute external URL, which still resolves", () => {
        expect(derive("https://github.com/webiny/webiny-js")).toBeUndefined();
    });

    it("keeps a scheme that cannot 404", () => {
        expect(derive("mailto:hello@webiny.com")).toBeUndefined();
        expect(derive("tel:+441234567890")).toBeUndefined();
    });

    it("still drops the bare placeholders", () => {
        expect(derive("#")).toEqual([]);
        expect(derive("")).toEqual([]);
    });
});
