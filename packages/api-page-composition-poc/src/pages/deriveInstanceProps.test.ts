import { describe, expect, it } from "vitest";
import { deriveInstanceProps } from "./deriveInstanceProps.js";
import type { SectionRun } from "./collectSectionTexts.js";

/** Terse run builder: `run("h2", "Pricing")`. */
const run = (tag: string, text: string): SectionRun => ({ tag, text });

const props = [
    { name: "title", observedValues: ["Build faster"] },
    { name: "subtitle", observedValues: ["Ship in days, not months"] }
];

describe("deriveInstanceProps", () => {
    it("reads each prop from the run playing the same role in the instance's own section", () => {
        const derived = deriveInstanceProps({
            props,
            representativeRuns: [
                run("h1", "Build faster"),
                run("p", "Ship in days, not months"),
                run("a", "Get started")
            ],
            instanceRuns: [
                run("h1", "Scale with confidence"),
                run("p", "Grow without rebuilding"),
                run("a", "Get started")
            ]
        });

        expect(derived).toEqual([
            { name: "title", value: "Scale with confidence", source: "role" },
            { name: "subtitle", value: "Grow without rebuilding", source: "role" }
        ]);
    });

    it("matches a heading to a heading at another level", () => {
        // The home page's h1 and the interior page's h2 are one slot, and treating them as two
        // roles was measured to report mis-alignments on sections that had aligned correctly.
        const derived = deriveInstanceProps({
            props: [{ name: "heading", observedValues: ["Park City Place"] }],
            representativeRuns: [
                run("h1", "Park City Place"),
                run("p", "Formerly the Holiday Inn")
            ],
            instanceRuns: [run("h2", "Bridgeport, Connecticut"), run("p", "Whether you're…")]
        });

        expect(derived[0]).toEqual({
            name: "heading",
            value: "Bridgeport, Connecticut",
            source: "role"
        });
    });

    it("holds its alignment when the instance gains runs ahead of the ones it matches", () => {
        // Measured on parkcityplace's contact page: two buttons the representative does not have
        // shifted every index by two, so `requiredFieldNote` rendered "privacy policy".
        const derived = deriveInstanceProps({
            props: [
                { name: "privacyText", observedValues: ["By submitting this form, you agree"] },
                { name: "requiredFieldNote", observedValues: ["* Required Field"] }
            ],
            representativeRuns: [
                run("h2", "Get In Touch!"),
                run("label", "Message (250 character limit)"),
                run("label", "By submitting this form, you agree"),
                run("span", "* Required Field")
            ],
            instanceRuns: [
                run("span", "Contact Us"),
                run("span", "Map & Directions"),
                run("label", "Message (250 character limit)"),
                run("label", "By submitting this form, you agree"),
                run("span", "* Required Field")
            ]
        });

        expect(derived).toEqual([
            {
                name: "privacyText",
                value: "By submitting this form, you agree",
                source: "role"
            },
            { name: "requiredFieldNote", value: "* Required Field", source: "role" }
        ]);
    });

    it("falls back to the same index, and says so, when no run plays that role", () => {
        const derived = deriveInstanceProps({
            props: [{ name: "heading", observedValues: ["Take in the Sights"] }],
            representativeRuns: [run("h2", "Take in the Sights")],
            instanceRuns: [run("span", "Contact Us")]
        });

        expect(derived[0]).toEqual({
            name: "heading",
            value: "Contact Us",
            source: "position"
        });
    });

    it("falls back to the cluster sample when the prop is not in the representative", () => {
        const derived = deriveInstanceProps({
            props: [{ name: "badge", observedValues: ["New"] }],
            representativeRuns: [run("h1", "Build faster")],
            instanceRuns: [run("h1", "Scale with confidence")]
        });

        expect(derived).toEqual([{ name: "badge", value: "New", source: "cluster" }]);
    });

    it("falls back to the cluster sample when the instance has no run to give", () => {
        const derived = deriveInstanceProps({
            props,
            representativeRuns: [run("h1", "Build faster"), run("p", "Ship in days, not months")],
            instanceRuns: [run("h1", "Scale with confidence")]
        });

        expect(derived[0]).toEqual({
            name: "title",
            value: "Scale with confidence",
            source: "role"
        });
        expect(derived[1]).toEqual({
            name: "subtitle",
            value: "Ship in days, not months",
            source: "cluster"
        });
    });

    it("matches case-insensitively and through truncation", () => {
        const derived = deriveInstanceProps({
            props: [{ name: "title", observedValues: ["build faster"] }],
            representativeRuns: [run("h1", "Build Faster — and keep shipping")],
            instanceRuns: [run("h1", "Scale with confidence")]
        });

        expect(derived[0]).toEqual({
            name: "title",
            value: "Scale with confidence",
            source: "role"
        });
    });

    it("never lets two props consume the same text run", () => {
        const derived = deriveInstanceProps({
            props: [
                { name: "title", observedValues: ["Pricing"] },
                { name: "heading", observedValues: ["Pricing"] }
            ],
            representativeRuns: [run("h1", "Pricing"), run("p", "Simple plans")],
            instanceRuns: [run("h1", "Plans"), run("p", "Pick one")]
        });

        expect(derived[0]).toEqual({ name: "title", value: "Plans", source: "role" });
        expect(derived[1]).toEqual({ name: "heading", value: "Pricing", source: "cluster" });
    });

    it("keeps an empty sample on the cluster source rather than aligning on nothing", () => {
        const derived = deriveInstanceProps({
            props: [{ name: "note", observedValues: [] }],
            representativeRuns: [run("h1", "Build faster")],
            instanceRuns: [run("h1", "Scale with confidence")]
        });

        expect(derived).toEqual([{ name: "note", value: "", source: "cluster" }]);
    });
});
