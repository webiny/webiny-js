import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { asPlainText, lexicalHtmlInputs, withInlineLinks } from "./lexicalHtml.js";
import { rewriteDestinations } from "./rewriteDestinations.js";

/*
 * Real generated sources and real captured sections (stored runs, 2026-10-10). The sections are the
 * Plan-side fixtures of the inline-link fold, so both sides are tested on the same pages.
 */
const source = (name: string): string =>
    readFileSync(new URL(`./__fixtures__/source-${name}.tsx.txt`, import.meta.url), "utf8");
const section = (name: string) =>
    JSON.parse(
        readFileSync(
            new URL(
                `../../../api-component-extraction/src/features/stages/plan/__fixtures__/inline-${name}.json`,
                import.meta.url
            ),
            "utf8"
        )
    ).section;

describe("which rich text inputs may carry a link", () => {
    it("is an input the component renders as HTML", () => {
        // Take 3's Property Description: dangerouslySetInnerHTML={{ __html: description }}.
        expect([...lexicalHtmlInputs(source("property-description-take3"))]).toEqual([
            "description"
        ]);
    });

    it("is not an input the component treats some other way", () => {
        // 2424 Tulane's Floor Plans Intro maps its rich text as an array: HTML would show as markup.
        expect([...lexicalHtmlInputs(source("floor-plans-intro-tulane"))]).toEqual([]);
    });
});

describe("putting inline links back into derived rich text", () => {
    it("wraps the link's words where the derived text has them", () => {
        const derived =
            "Whether you’re an adventurer or a total homebody, you’ll love our ideal location in Bridgeport.";
        expect(withInlineLinks(derived, section("take3-neighborhood-highlight"))).toBe(
            'Whether you’re an adventurer or a total homebody, you’ll love <a href="https://www.parkcityplace.org/apartments/ct/bridgeport/neighborhood">our ideal location</a> in Bridgeport.'
        );
    });

    it("rebuilds a sentence the derivation split around its link", () => {
        expect(
            withInlineLinks(
                "By submitting this form, you agree to the",
                section("take3-contact-us-form")
            )
        ).toBe(
            'By submitting this form, you agree to the <a href="https://cthousingpartners.org/privacy-policy/">privacy policy</a>.'
        );
    });

    it("leaves text with nothing to link unchanged", () => {
        const plain = "Send us a message and we will get back to you.";
        expect(withInlineLinks(plain, section("take3-contact-us-form"))).toBe(plain);
    });
});

describe("destinations inside rich text", () => {
    it("get the same three-way rule as a link input", () => {
        const result = rewriteDestinations({
            bindings: {
                el1: {
                    inputs: {
                        body: {
                            type: "lexical",
                            static: 'You’ll love <a href="https://www.parkcityplace.org/apartments/ct/bridgeport/neighborhood">our ideal location</a>, see the <a href="https://cthousingpartners.org/privacy-policy/">policy</a> and <a href="https://www.parkcityplace.org/old-page">this</a>.'
                        }
                    }
                }
            },
            migratedPaths: new Set(["/apartments/ct/bridgeport/neighborhood"]),
            sourceHost: "www.parkcityplace.org"
        });
        expect(result.bindings.el1.inputs.body.static).toBe(
            'You’ll love <a href="/apartments/ct/bridgeport/neighborhood">our ideal location</a>, see the <a href="https://cthousingpartners.org/privacy-policy/">policy</a> and <a href="https://www.parkcityplace.org/old-page">this</a>.'
        );
        expect(result.outcomes.map(o => o.kind)).toEqual(["rewritten", "external", "unmigrated"]);
    });
});

/*
 * The three defects Take 3's built site showed (inline-link-fold-replay.md, "Take 3 built into its own
 * tenant"), each from the page it was seen on.
 */
describe("after building Take 3", () => {
    it("does not link the words in a value that does not hold the link's paragraph", () => {
        // The home page heading: "our ideal location" has no link on the source.
        const heading = "Explore our ideal location in Bridgeport.";
        expect(withInlineLinks(heading, section("take3-neighborhood-highlight"))).toBe(heading);
    });

    it("leaves a value that is only the link's words as it is, so the lost sentence stays visible", () => {
        // The neighborhood page's body was "your new home" alone: a wrong-slot value, not a paragraph.
        expect(withInlineLinks("our ideal location", section("take3-neighborhood-highlight"))).toBe(
            "our ideal location"
        );
    });

    it("does not rebuild a sentence the component assembles with its own link", () => {
        // Contact Form appends its own privacy link: the rebuilt sentence showed it twice.
        expect(
            withInlineLinks(
                "By submitting this form, you agree to the",
                section("take3-contact-us-form"),
                new Set(["privacy policy"])
            )
        ).toBe("By submitting this form, you agree to the");
    });

    it("writes plain text into an input that does not render HTML", () => {
        // Contact Us Form's privacyText on the amenities page printed the markup.
        expect(
            asPlainText(
                'By submitting this form, you agree to the <a href="https://cthousingpartners.org/privacy-policy/">privacy policy</a>.'
            )
        ).toBe("By submitting this form, you agree to the privacy policy.");
    });

    it("drops a link's words too when the component renders that link itself", () => {
        // Contact Us Form appends its own privacy link: keeping the words showed the phrase twice.
        expect(
            asPlainText(
                'By submitting this form, you agree to the <a href="https://cthousingpartners.org/privacy-policy/">privacy policy</a>.',
                new Set(["privacy policy"])
            )
        ).toBe("By submitting this form, you agree to the.");
    });

    it("leaves other markup in a plain input alone", () => {
        const icon = '<svg viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>';
        expect(asPlainText(icon)).toBe(icon);
    });
});
