import { describe, expect, it } from "vitest";
import { deriveInstanceProps } from "./deriveInstanceProps.js";

const props = [
    { name: "title", observedValues: ["Build faster"] },
    { name: "subtitle", observedValues: ["Ship in days, not months"] }
];

describe("deriveInstanceProps", () => {
    it("reads each prop from the matching position in the instance's own texts", () => {
        const derived = deriveInstanceProps({
            props,
            representativeTexts: ["Build faster", "Ship in days, not months", "Get started"],
            instanceTexts: ["Scale with confidence", "Grow without rebuilding", "Get started"]
        });

        expect(derived).toEqual([
            { name: "title", value: "Scale with confidence", source: "instance" },
            { name: "subtitle", value: "Grow without rebuilding", source: "instance" }
        ]);
    });

    it("falls back to the cluster sample when the prop is not in the representative", () => {
        const derived = deriveInstanceProps({
            props: [{ name: "badge", observedValues: ["New"] }],
            representativeTexts: ["Build faster"],
            instanceTexts: ["Scale with confidence"]
        });

        expect(derived).toEqual([{ name: "badge", value: "New", source: "cluster" }]);
    });

    it("falls back when the instance section is shorter than the representative", () => {
        const derived = deriveInstanceProps({
            props,
            representativeTexts: ["Build faster", "Ship in days, not months"],
            instanceTexts: ["Scale with confidence"]
        });

        expect(derived[0]).toEqual({
            name: "title",
            value: "Scale with confidence",
            source: "instance"
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
            representativeTexts: ["Build Faster — and keep shipping"],
            instanceTexts: ["Scale with confidence"]
        });

        expect(derived[0]?.source).toBe("instance");
        expect(derived[0]?.value).toBe("Scale with confidence");
    });

    it("never lets two props consume the same text run", () => {
        const derived = deriveInstanceProps({
            props: [
                { name: "title", observedValues: ["Pricing"] },
                { name: "heading", observedValues: ["Pricing"] }
            ],
            representativeTexts: ["Pricing", "Simple plans"],
            instanceTexts: ["Plans", "Pick one"]
        });

        expect(derived[0]).toEqual({ name: "title", value: "Plans", source: "instance" });
        expect(derived[1]).toEqual({ name: "heading", value: "Pricing", source: "cluster" });
    });

    it("keeps an empty sample on the cluster source rather than aligning on nothing", () => {
        const derived = deriveInstanceProps({
            props: [{ name: "note", observedValues: [] }],
            representativeTexts: ["Build faster"],
            instanceTexts: ["Scale with confidence"]
        });

        expect(derived).toEqual([{ name: "note", value: "", source: "cluster" }]);
    });
});
