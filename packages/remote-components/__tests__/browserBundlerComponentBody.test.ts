import { describe, it, expect } from "vitest";
import { extractComponentBody } from "~/admin/bundler/browserBundler.js";

const source = `
const SIZE = 20;

function CheckIcon() {
    return "check-" + SIZE;
}

export function formatFeature(feature) {
    return CheckIcon() + ":" + feature;
}

export default function PricingPlans({ inputs }) {
    return inputs.features.map(formatFeature).join(",");
}

export const manifest = {
    name: "Custom/PricingPlans",
    inputs: [{ name: "features", factory: "createTagsInput", params: { label: "Features" } }]
};
`;

describe("extractComponentBody", () => {
    it("keeps the helpers declared next to the component", () => {
        const body = extractComponentBody(source);

        expect(body).toContain("const SIZE = 20;");
        expect(body).toContain("function CheckIcon()");
        expect(body).toContain("function formatFeature(feature)");
        expect(body).toContain("function PricingPlans({ inputs })");
    });

    it("strips export keywords and drops the manifest", () => {
        const body = extractComponentBody(source);

        expect(body).not.toMatch(/\bexport\b/);
        expect(body).not.toContain("manifest");
    });

    it("produces a body in which the component can call its helpers", () => {
        // Mirrors how the body is inlined into the `createComponent` factory.
        const PricingPlans = new Function(
            `${extractComponentBody(source)}\nreturn PricingPlans;`
        )();

        expect(PricingPlans({ inputs: { features: ["a", "b"] } })).toBe("check-20:a,check-20:b");
    });
});
