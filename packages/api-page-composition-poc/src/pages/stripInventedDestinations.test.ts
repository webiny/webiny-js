import { describe, expect, it } from "vitest";
import { stripInventedDestinations } from "./stripInventedDestinations.js";

const SOURCE_HOST = "promo.freehillstreetlofts.com";
const CAPTURED = new Set([
    "https://promo.freehillstreetlofts.com/",
    "https://promo.freehillstreetlofts.com/apartments/tx/houston/privacy-policy",
    "https://www.google.com/maps?cid=1"
]);

const context = { captured: CAPTURED, sourceHost: SOURCE_HOST };

const manifest = (inputs: unknown[]) => ({ inputs }) as never;

describe("stripInventedDestinations — the shapes the rule never used to be asked about", () => {
    /*
     * The five-site case. The real page exists and was migrated at a deep path; the model wrote a
     * short one that 404s. It sat on a single composite, which the list-only check never reached.
     */
    it("empties an invented destination on a single composite", () => {
        const result = stripInventedDestinations({
            inputs: { privacyPolicyLink: { label: "Privacy Policy", url: "/privacy-policy" } },
            manifest: manifest([
                {
                    name: "privacyPolicyLink",
                    fields: [{ name: "label" }, { name: "url", type: "url" }]
                }
            ]),
            context
        });

        expect(result.inputs.privacyPolicyLink).toEqual({ label: "Privacy Policy", url: "" });
        expect(result.invented).toEqual([
            { path: "privacyPolicyLink/url", value: "/privacy-policy" }
        ]);
    });

    it("empties an invented destination on a plain scalar", () => {
        const result = stripInventedDestinations({
            inputs: { ctaHref: "/residents", heading: "Residents" },
            manifest: manifest([{ name: "ctaHref", type: "url" }, { name: "heading" }]),
            context
        });

        expect(result.inputs.ctaHref).toBe("");
        expect(result.inputs.heading).toBe("Residents");
        expect(result.invented).toHaveLength(1);
    });

    it("reaches a destination nested inside a list of composites", () => {
        const result = stripInventedDestinations({
            inputs: {
                columns: [
                    { heading: "Company", links: [{ label: "Residents", url: "/residents" }] }
                ]
            },
            manifest: manifest([
                {
                    name: "columns",
                    list: true,
                    fields: [
                        { name: "heading" },
                        { name: "links", list: true, fields: [{ name: "label" }, { name: "url" }] }
                    ]
                }
            ]),
            context
        });

        expect(result.invented.map(item => item.path)).toEqual(["columns/0/links/0/url"]);
    });
});

describe("stripInventedDestinations — what it must not touch", () => {
    it("keeps a destination this section actually linked to", () => {
        const captured =
            "https://promo.freehillstreetlofts.com/apartments/tx/houston/privacy-policy";
        const result = stripInventedDestinations({
            inputs: { link: { url: captured } },
            manifest: manifest([{ name: "link", fields: [{ name: "url" }] }]),
            context
        });

        expect(result.inputs.link).toEqual({ url: captured });
        expect(result.invented).toHaveLength(0);
    });

    it("keeps another host and a non-page scheme", () => {
        const result = stripInventedDestinations({
            inputs: { mapUrl: "https://maps.example.com/x", phoneHref: "tel:475-334-1114" },
            manifest: manifest([{ name: "mapUrl" }, { name: "phoneHref" }]),
            context
        });

        expect(result.inputs.mapUrl).toBe("https://maps.example.com/x");
        expect(result.inputs.phoneHref).toBe("tel:475-334-1114");
        expect(result.invented).toHaveLength(0);
    });

    it("leaves fields that are not destinations alone, even when they look like paths", () => {
        const result = stripInventedDestinations({
            inputs: { heading: "/not/a/destination", imageAlt: "/still/not" },
            manifest: manifest([{ name: "heading" }, { name: "imageAlt" }]),
            context
        });

        expect(result.inputs.heading).toBe("/not/a/destination");
        expect(result.invented).toHaveLength(0);
    });

    /*
     * An already-empty destination is not a finding. Recording it would inflate the dropped count
     * with inputs the model never filled in.
     */
    it("does not record a destination that was already empty", () => {
        const result = stripInventedDestinations({
            inputs: { cta: { url: "" }, other: { url: "#" } },
            manifest: manifest([
                { name: "cta", fields: [{ name: "url" }] },
                { name: "other", fields: [{ name: "url" }] }
            ]),
            context
        });

        expect(result.invented).toHaveLength(0);
        expect(result.inputs.other).toEqual({ url: "" });
    });

    it("ignores an input the manifest does not declare", () => {
        const result = stripInventedDestinations({
            inputs: { undeclaredUrl: "/invented" },
            manifest: manifest([{ name: "somethingElse" }]),
            context
        });

        expect(result.inputs.undeclaredUrl).toBe("/invented");
    });
});
