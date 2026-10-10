import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { CapturedNode, ComponentProp } from "~/domain/artifacts.js";
import { findInlineLinks, foldInlineLinks } from "./inlineLinks.js";

/*
 * Every case is a real section and the real Plan props of its component, from stored runs
 * (inline-links-are-lifted-into-standalone-link-props.md). The Vibe's section is trimmed to the block
 * holding the address and its link.
 */
const fixture = (name: string): { section: CapturedNode; props: ComponentProp[] } =>
    JSON.parse(
        readFileSync(new URL(`./__fixtures__/inline-${name}.json`, import.meta.url), "utf8")
    );

const fold = (name: string) => {
    const { section, props } = fixture(name);
    const result = foldInlineLinks([section], props);
    const prop = (propName: string) => props.find(p => p.name === propName);
    return { result, props, prop };
};

describe("finding inline links", () => {
    it("reads through a text-less <strong> to the paragraph", () => {
        // <p>…you'll love <strong><a>our ideal location</a></strong> in Bridgeport…</p>
        const labels = findInlineLinks(fixture("take3-neighborhood-highlight").section).map(
            l => l.label
        );
        expect(labels).toContain("our ideal location");
    });

    it("does not count navigation as inline", () => {
        expect(findInlineLinks(fixture("take3-site-navigation-header").section)).toEqual([]);
    });
});

describe("folding them back into the paragraph", () => {
    it("puts the duplicated phrase inside the paragraph once, with its destination", () => {
        const { result, prop } = fold("take3-neighborhood-highlight");
        // The representative's section; "in-home features" is on another member's.
        expect(result.folded.map(f => f.label)).toEqual(["our ideal location"]);
        const body = prop("body")!.observedValues.join(" ");
        expect(body).toContain(
            '<a href="https://www.parkcityplace.org/apartments/ct/bridgeport/neighborhood">our ideal location</a> in Bridgeport'
        );
        // The Link prop gives it up; it keeps "your new home", whose paragraph went to `heading`.
        expect(prop("imageLink")!.observedValues).not.toContain("our ideal location");
        expect(prop("imageLink")!.observedValues).toContain("your new home");
    });

    it("rejoins a split sentence with its link, and removes the prop that held it in the wrong place", () => {
        // "By submitting this form, you agree to the" + "privacy policy" (in mapLink) + "."
        const { result, prop } = fold("take3-contact-us-form");
        expect(prop("privacyText")!.observedValues).toContain(
            'By submitting this form, you agree to the <a href="https://cthousingpartners.org/privacy-policy/">privacy policy</a>.'
        );
        expect(result.pruned).toEqual(["mapLink"]);
        expect(prop("mapLink")).toBeUndefined();
        // The form's submit is never touched.
        expect(prop("submitButton")!.observedValues).toEqual(["Send"]);
    });

    it("gives the 71 Westland intro its whole sentence back, link included", () => {
        const { prop } = fold("westland-hero-banner");
        const [description] = prop("description")!.observedValues;
        expect(description).toMatch(
            /^Choose from our <a href="https:\/\/www\.71westlandapts\.com\/apartments\/ma\/boston\/floor-plans">studio, 1 and 2 bedroom<\/a> apartments in Boston, Massachusetts, and have it all\./
        );
        expect(prop("cta")).toBeUndefined();
    });

    it("leaves a standalone link beside a block of text alone", () => {
        // The Vibe's "Directions" after an address: its block is not rich text.
        const { result, props } = fold("thevibe-directions");
        const before = fixture("thevibe-directions").props;
        expect(result.folded).toEqual([]);
        expect(props).toEqual(before);
    });

    it("changes nothing on a second pass", () => {
        const { section, props } = fixture("take3-contact-us-form");
        foldInlineLinks([section], props);
        const once = structuredClone(props);
        foldInlineLinks([section], props);
        expect(props).toEqual(once);
    });
});
