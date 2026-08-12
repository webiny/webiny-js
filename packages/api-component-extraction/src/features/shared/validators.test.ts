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
