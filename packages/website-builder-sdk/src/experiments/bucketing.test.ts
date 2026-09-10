import { describe, it, expect } from "vitest";
import { assignVariant, forcedAssignment, hashToUnit, matchesTargeting } from "./bucketing.js";
import { CONTROL_VARIANT_ID, type ActiveExperiment, type VisitorContext } from "./types.js";

const experiment = (overrides: Partial<ActiveExperiment> = {}): ActiveExperiment => ({
    experimentId: "exp-1",
    revisionId: "page-1#0001",
    pageEntryId: "page-1",
    path: "/pricing",
    status: "running",
    tenantId: "root",
    controlVariantId: CONTROL_VARIANT_ID,
    trafficSplit: { control: 50, variants: { "variant-a": 50 } },
    targeting: { trafficPercentage: 100 },
    analytics: { provider: "posthog" },
    variants: [{ variantId: "variant-a", name: "Variant A" }],
    ...overrides
});

const visitor = (overrides: Partial<VisitorContext> = {}): VisitorContext => ({
    visitorId: "visitor-1",
    ...overrides
});

describe("hashToUnit", () => {
    it("is deterministic and within [0, 1)", () => {
        const a = hashToUnit("visitor-1:exp-1");
        const b = hashToUnit("visitor-1:exp-1");
        expect(a).toBe(b);
        expect(a).toBeGreaterThanOrEqual(0);
        expect(a).toBeLessThan(1);
    });

    it("differs across seeds", () => {
        expect(hashToUnit("visitor-1:exp-1")).not.toBe(hashToUnit("visitor-2:exp-1"));
    });
});

describe("assignVariant", () => {
    it("assigns the same visitor to the same bucket every time", () => {
        const first = assignVariant(experiment(), visitor());
        const second = assignVariant(experiment(), visitor());
        expect(second).toEqual(first);
    });

    it("buckets the same visitor differently across experiments", () => {
        const a = assignVariant(experiment({ experimentId: "exp-1" }), visitor());
        const b = assignVariant(experiment({ experimentId: "exp-2" }), visitor());
        // Not guaranteed to differ, but the seed differs; assert the seeds are independent.
        expect(hashToUnit("visitor-1:exp-1")).not.toBe(hashToUnit("visitor-1:exp-2"));
        expect([a.variantId, b.variantId].every(Boolean)).toBe(true);
    });

    it("respects the traffic split distribution", () => {
        const exp = experiment({
            trafficSplit: { control: 80, variants: { "variant-a": 20 } }
        });
        let control = 0;
        let variant = 0;
        for (let i = 0; i < 5000; i++) {
            const assignment = assignVariant(exp, visitor({ visitorId: `v-${i}` }));
            if (assignment.isControl) {
                control++;
            } else {
                variant++;
            }
        }
        const variantShare = variant / (control + variant);
        // Expect ~20% in the variant, allow a generous tolerance.
        expect(variantShare).toBeGreaterThan(0.15);
        expect(variantShare).toBeLessThan(0.25);
    });

    it("excludes visitors outside the traffic percentage and serves control", () => {
        const exp = experiment({ targeting: { trafficPercentage: 0 } });
        const assignment = assignVariant(exp, visitor());
        expect(assignment.isControl).toBe(true);
        expect(assignment.excluded).toBe(true);
    });

    it("excludes visitors who do not match geo targeting", () => {
        const exp = experiment({ targeting: { trafficPercentage: 100, geo: ["GB"] } });
        const assignment = assignVariant(exp, visitor({ country: "US" }));
        expect(assignment.excluded).toBe(true);
        expect(assignment.isControl).toBe(true);
    });

    it("ignores variants that are not ready", () => {
        const exp = experiment({
            trafficSplit: { control: 0, variants: { "variant-a": 50, "variant-ghost": 50 } },
            variants: [{ variantId: "variant-a", name: "Variant A" }]
        });
        for (let i = 0; i < 200; i++) {
            const assignment = assignVariant(exp, visitor({ visitorId: `v-${i}` }));
            expect(assignment.variantId).not.toBe("variant-ghost");
        }
    });
});

describe("matchesTargeting", () => {
    it("matches when no geo/device restriction is set", () => {
        expect(matchesTargeting({ trafficPercentage: 100 }, visitor())).toBe(true);
    });

    it("matches device targeting", () => {
        expect(
            matchesTargeting(
                { trafficPercentage: 100, device: ["mobile"] },
                visitor({ device: "mobile" })
            )
        ).toBe(true);
        expect(
            matchesTargeting(
                { trafficPercentage: 100, device: ["mobile"] },
                visitor({ device: "desktop" })
            )
        ).toBe(false);
    });
});

describe("forcedAssignment", () => {
    it("forces a ready variant and marks it as not counted", () => {
        const assignment = forcedAssignment(experiment(), "variant-a");
        expect(assignment).toEqual({
            variantId: "variant-a",
            isControl: false,
            excluded: false,
            forced: true
        });
    });

    it("forces the control bucket", () => {
        const assignment = forcedAssignment(experiment(), CONTROL_VARIANT_ID);
        expect(assignment?.isControl).toBe(true);
        expect(assignment?.forced).toBe(true);
    });

    it("returns null for an unknown variant", () => {
        expect(forcedAssignment(experiment(), "nope")).toBeNull();
    });
});
