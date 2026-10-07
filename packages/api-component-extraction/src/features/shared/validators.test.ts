import { describe, expect, it } from "vitest";
import {
    validateRenderedValues,
    validateContractConformance,
    validateTextPreservation,
    validateTokenBinding,
    textsToPreserve
} from "./validators.js";

describe("validateTextPreservation", () => {
    it("passes when every source text appears (whitespace-insensitive)", () => {
        const result = validateTextPreservation(
            ["Ready to get started?", "Get Started"],
            `<h2>Ready   to get started?</h2><button>Get Started</button>`
        );
        expect(result.passed).toBe(true);
    });

    it("fails and lists text that was dropped or paraphrased", () => {
        const result = validateTextPreservation(
            ["Join thousands of teams"],
            `<p>Join many teams</p>`
        );
        expect(result.passed).toBe(false);
        expect(result.failures[0]).toContain("Join thousands of teams");
    });

    it("matches source text the model wrote with unicode and newline escapes", () => {
        // A model writes the page's text into a string literal, so a curly apostrophe arrives as
        // ’ and a line break as \n. The fragment still has the real characters.
        const source = `const BODY = "you\\u2019ll be close to work,\\nshopping and more";
            export default function C() { return BODY; }`;
        const result = validateTextPreservation(
            ["you’ll be close to work, shopping and more"],
            "",
            [],
            source
        );
        expect(result.passed).toBe(true);
    });

    it("survives a null observed value, which DynamoDB returns for an empty string", () => {
        // convertEmptyValues is on for every document client, so "" is stored as NULL and read back
        // as null. Generate calls this outside a try/catch, so an unguarded null fails the stage.
        const run = () =>
            validateTextPreservation(
                ["Ready to get started?"],
                "<h2>Ready to get started?</h2>",
                [null as unknown as string, "Ready to get started?"],
                ""
            );
        expect(run).not.toThrow();
        expect(run().passed).toBe(true);
    });

    it("still fails text that is absent, escapes decoded or not", () => {
        const source = `const BODY = "you\\u2019ll be close to work";
            export default function C() { return BODY; }`;
        const result = validateTextPreservation(
            ["an entirely different paragraph"],
            "",
            [],
            source
        );
        expect(result.passed).toBe(false);
    });
});

describe("validateContractConformance", () => {
    it("passes when every declared prop is referenced", () => {
        const source = `export default function C({ heading, ctaLabel }) { return heading + ctaLabel; }`;
        expect(validateContractConformance(["heading", "ctaLabel"], source).passed).toBe(true);
    });

    it("fails and names the prop the component never exposes", () => {
        const result = validateContractConformance(
            ["heading", "subtitle"],
            `function C({ heading }) {}`
        );
        expect(result.passed).toBe(false);
        expect(result.failures).toEqual(['missing prop: "subtitle"']);
    });
});

describe("validateTokenBinding", () => {
    const valid = new Set(["--wby-color-brand-primary", "--wby-space-lg"]);

    it("passes when every var(--wby-*) is a known manifest variable", () => {
        const css = `.hero { color: var(--wby-color-brand-primary); padding: var(--wby-space-lg); }`;
        expect(validateTokenBinding(css, valid).passed).toBe(true);
    });

    it("fails and lists variables not in the manifest", () => {
        const css = `.hero { color: var(--wby-color-made-up); }`;
        const result = validateTokenBinding(css, valid);
        expect(result.passed).toBe(false);
        expect(result.failures).toEqual(["unknown token variable: --wby-color-made-up"]);
    });
});

describe("textsToPreserve", () => {
    it("drops icon ligatures and bare punctuation", () => {
        expect(
            textsToPreserve([
                "Bedrooms",
                "keyboard_arrow_down",
                "attach_money",
                ".",
                ",",
                "Reset Filters"
            ])
        ).toEqual(["Bedrooms", "Reset Filters"]);
    });

    it("keeps content that merely looks terse", () => {
        // The narrow rule matters: these were measured as content across the five sites.
        expect(textsToPreserve(["70119", "02115", "2026", "578", "downtown"])).toEqual([
            "70119",
            "02115",
            "2026",
            "578",
            "downtown"
        ]);
    });

    it("drops a non-string the artifact round-tripped to null", () => {
        expect(textsToPreserve(["Apply Now", null as unknown as string])).toEqual(["Apply Now"]);
    });
});

// Markup rendered from real generated components (the Freehill header, the Park City hero).
describe("validateRenderedValues", () => {
    it("fails a file input's object rendered into an attribute, naming where", () => {
        const result = validateRenderedValues(
            '<header class="site-header" style="background:#26464b"><div class="site-header-inner"><a href="/" class="site-header-logo-link"><img class="site-header-logo" src="[object Object]" alt="Freehill Street Lofts"/></a></div></header>'
        );
        expect(result.passed).toBe(false);
        expect(result.failures[0]).toContain("the src attribute of <img>");
        expect(result.failures[0]).toContain("logo.src.url");
    });

    it("fails one rendered into an inline style, once however many times it repeats", () => {
        const result = validateRenderedValues(
            '<div class="hero-banner-image is-active" style="background-image:url([object Object])" role="img"></div><div class="hero-banner-image " style="background-image:url([object Object])" role="img"></div>'
        );
        expect(result.passed).toBe(false);
        expect(result.failures).toHaveLength(1);
        expect(result.failures[0]).toContain("the inline style of <div>");
    });

    it("passes markup whose values rendered as values", () => {
        expect(
            validateRenderedValues(
                '<img class="site-header-logo" src="https://res.cloudinary.com/g5/Logo_xkmkne.png" alt="Freehill Street Lofts"/>'
            ).passed
        ).toBe(true);
    });
});
