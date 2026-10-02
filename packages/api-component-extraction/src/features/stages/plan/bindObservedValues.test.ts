import { describe, expect, it } from "vitest";
import type { CapturedNode, ComponentProp } from "~/domain/artifacts.js";
import { bindObservedValues } from "./bindObservedValues.js";

const node = (tag: string, extra: Partial<CapturedNode> = {}): CapturedNode => ({
    tag,
    box: { x: 0, y: 0, width: 100, height: 100 },
    styles: {},
    children: [],
    ...extra
});

const prop = (name: string, type: string, extra: Partial<ComponentProp> = {}): ComponentProp => ({
    name,
    type,
    observedValues: [],
    ...extra
});

describe("bindObservedValues", () => {
    it("binds a scalar image prop to the first image in document order", () => {
        const section = node("div", {
            children: [
                node("img", { src: "https://cdn.example/one.jpg", alt: "One" }),
                node("img", { src: "https://cdn.example/two.jpg" })
            ]
        });
        const props = [prop("logo", "Image")];

        bindObservedValues([section], props);

        expect(props[0].observedStructured).toEqual([
            { kind: "media", src: "https://cdn.example/one.jpg", alt: "One" }
        ]);
    });

    it("binds a link and puts its label on the text path", () => {
        const section = node("div", {
            children: [node("a", { href: "https://example.com/tour", text: "Schedule a Tour" })]
        });
        const props = [prop("cta", "Link")];

        bindObservedValues([section], props);

        expect(props[0].observedStructured).toEqual([
            { kind: "link", label: "Schedule a Tour", href: "https://example.com/tour" }
        ]);
        // The label is a string, so it joins observedValues and every existing text consumer sees it
        // without learning about a new type.
        expect(props[0].observedValues).toEqual(["Schedule a Tour"]);
    });

    it("fills a list prop one item per repeated sibling, each from its own subtree", () => {
        const card = (heading: string, src: string, href: string): CapturedNode =>
            node("article", {
                children: [
                    node("img", { src }),
                    node("h3", { text: heading }),
                    node("a", { href, text: `View ${heading}` })
                ]
            });
        const section = node("section", {
            children: [
                node("div", {
                    children: [
                        card("Floor Plans", "https://cdn.example/plans.jpg", "/plans"),
                        card("Amenities", "https://cdn.example/gym.jpg", "/amenities")
                    ]
                })
            ]
        });
        const props = [
            prop("items", "object", {
                array: true,
                fields: [prop("image", "Image"), prop("heading", "string"), prop("link", "Link")]
            })
        ];

        bindObservedValues([section], props);

        expect(props[0].observedStructured).toEqual([
            {
                kind: "item",
                fields: {
                    image: { src: "https://cdn.example/plans.jpg" },
                    heading: "Floor Plans",
                    link: { label: "View Floor Plans", href: "/plans" }
                }
            },
            {
                kind: "item",
                fields: {
                    image: { src: "https://cdn.example/gym.jpg" },
                    heading: "Amenities",
                    link: { label: "View Amenities", href: "/amenities" }
                }
            }
        ]);
    });

    it("does not pair one item's label with another item's destination", () => {
        // The reason a list is derived per subtree rather than by zipping section-wide harvests.
        const section = node("section", {
            children: [
                node("div", {
                    children: [
                        node("article", {
                            children: [node("a", { href: "/a", text: "First" })]
                        }),
                        node("article", {
                            children: [node("a", { href: "/b", text: "Second" })]
                        })
                    ]
                })
            ]
        });
        const props = [prop("links", "object", { array: true, fields: [prop("link", "Link")] })];

        bindObservedValues([section], props);

        const items = props[0].observedStructured ?? [];
        expect(items).toHaveLength(2);
        expect(items[0]).toEqual({
            kind: "item",
            fields: { link: { label: "First", href: "/a" } }
        });
        expect(items[1]).toEqual({
            kind: "item",
            fields: { link: { label: "Second", href: "/b" } }
        });
    });

    it("does not let a later prop re-read content a list already took", () => {
        const section = node("section", {
            children: [
                node("ul", {
                    children: [
                        node("li", { children: [node("a", { href: "/one", text: "One" })] }),
                        node("li", { children: [node("a", { href: "/two", text: "Two" })] })
                    ]
                })
            ]
        });
        const props = [
            prop("navLinks", "object", { array: true, fields: [prop("link", "Link")] }),
            prop("cta", "Link")
        ];

        bindObservedValues([section], props);

        expect(props[0].observedStructured).toHaveLength(2);
        // Every link in the section belongs to the list, so the trailing scalar has nothing left.
        expect(props[1].observedStructured).toBeUndefined();
    });

    it("leaves text props alone", () => {
        const section = node("div", { children: [node("h1", { text: "Welcome" })] });
        const props = [prop("heading", "string")];

        bindObservedValues([section], props);

        expect(props[0].observedStructured).toBeUndefined();
        expect(props[0].observedValues).toEqual([]);
    });

    it("reports what it bound", () => {
        const section = node("div", {
            children: [
                node("img", { src: "https://cdn.example/a.jpg" }),
                node("a", { href: "/x", text: "Go" })
            ]
        });
        const props = [prop("image", "Image"), prop("cta", "Link")];

        expect(bindObservedValues([section], props)).toEqual({
            propsBound: 2,
            mediaBound: 1,
            linksBound: 1,
            itemsBound: 0
        });
    });
});

describe("bindObservedValues across members", () => {
    const nav = (label: string, href: string): CapturedNode =>
        node("nav", { children: [node("a", { href, text: label })] });

    it("observes values from every member, not just the first", () => {
        // The case the single-section version could not serve: the texts a prop most needs to hold
        // are the ones the reference section does not contain.
        const props = [prop("navLinks", "Link", { array: true })];

        bindObservedValues([nav("Home", "/"), nav("Contact", "/contact")], props);

        expect(props[0].observedStructured).toEqual([
            { kind: "link", label: "Home", href: "/" },
            { kind: "link", label: "Contact", href: "/contact" }
        ]);
        expect(props[0].observedValues).toEqual(["Home", "Contact"]);
    });

    it("observes a value shared by every member once", () => {
        const props = [prop("logo", "Image")];
        const withLogo = () =>
            node("div", { children: [node("img", { src: "https://cdn.example/logo.svg" })] });

        bindObservedValues([withLogo(), withLogo(), withLogo()], props);

        expect(props[0].observedStructured).toEqual([
            { kind: "media", src: "https://cdn.example/logo.svg" }
        ]);
    });

    it("counts a prop bound by several members once", () => {
        const props = [prop("navLinks", "Link", { array: true })];
        expect(bindObservedValues([nav("A", "/a"), nav("B", "/b")], props).propsBound).toBe(1);
    });
});
