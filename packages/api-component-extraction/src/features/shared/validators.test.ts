import { describe, expect, it } from "vitest";
import {
    validateContractConformance,
    validateTextPreservation,
    validateTokenBinding
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
