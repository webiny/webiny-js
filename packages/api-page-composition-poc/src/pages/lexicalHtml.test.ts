import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { lexicalHtmlInputs, withInlineLinks } from "./lexicalHtml.js";
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
