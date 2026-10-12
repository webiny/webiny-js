import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { planComponentCopy } from "./planComponentCopy.js";

/*
 * The validation site after one re-approve-and-publish cycle: run-0001's approval record and the site
 * tenant's 12 components (6 live, 6 left over).
 */
const fixture = JSON.parse(
    readFileSync(new URL("./__fixtures__/validation-copy.json", import.meta.url), "utf8")
) as {
    approved: Array<{ signature: string; name: string }>;
    siteComponents: Array<{ id: string; name: string }>;
};
const idOf = (name: string) => fixture.siteComponents.find(c => c.name === name)!.id;

/** The next re-approval: every name one suffix further on, as stage 9's keep-both gives it. */
const reapproved = fixture.approved.map(item => ({
    signature: item.signature,
    name: item.name
        .replace(/ \((\d+)\)$/, (_, n) => ` (${Number(n) + 1})`)
        .replace(/^([^(]*[^)])$/, "$1 (2)")
}));

describe("planComponentCopy", () => {
    it("on the first build with no map, updates the components holding the approved names", () => {
        const plan = planComponentCopy({
            approved: fixture.approved,
            siteComponents: fixture.siteComponents,
            bySignature: {}
        });
        expect(plan.map(step => step.updateId)).toEqual(fixture.approved.map(a => idOf(a.name)));
    });

    it("on a re-approval, updates the component this cluster already has instead of adding one", () => {
        const bySignature = Object.fromEntries(
            fixture.approved.map(a => [a.signature, idOf(a.name)])
        );
        const plan = planComponentCopy({
            approved: reapproved,
            siteComponents: fixture.siteComponents,
            bySignature
        });
        // Matched by name, all six were created, beside the old ones: 6 bundles to 12.
        expect(plan.filter(step => step.updateId === null)).toEqual([]);
        expect(plan.map(step => step.updateId)).toEqual(
            fixture.approved.map(a => bySignature[a.signature])
        );
        expect(plan.map(step => step.name)).toEqual(reapproved.map(a => a.name));
    });

    it("on the first build with no map, reuses the latest copy instead of adding a set of leftovers", () => {
        // Re-approved before the map existed: every name is new to the site.
        const plan = planComponentCopy({
            approved: reapproved,
            siteComponents: fixture.siteComponents,
            bySignature: {}
        });
        expect(plan.filter(step => step.updateId === null)).toEqual([]);
        // The latest copy of each, which the live pages use, not the older leftover.
        expect(plan.map(step => step.updateId)).toEqual(fixture.approved.map(a => idOf(a.name)));
    });

    it("does not seed two approved components that share a base name", () => {
        const [first] = fixture.approved;
        const plan = planComponentCopy({
            approved: [
                { signature: "one", name: `${first.name.replace(/ \(\d+\)$/, "")} (9)` },
                { signature: "two", name: `${first.name.replace(/ \(\d+\)$/, "")} (10)` }
            ],
            siteComponents: fixture.siteComponents,
            bySignature: {}
        });
        expect(plan.map(step => step.updateId)).toEqual([null, null]);
    });

    it("creates a component for a cluster the site has never held", () => {
        const plan = planComponentCopy({
            approved: [{ signature: "a-new-cluster", name: "Validationwebinycom/Pricing Table" }],
            siteComponents: fixture.siteComponents,
            bySignature: {}
        });
        expect(plan).toEqual([
            {
                signature: "a-new-cluster",
                name: "Validationwebinycom/Pricing Table",
                updateId: null
            }
        ]);
    });

    it("never puts two clusters into one component", () => {
        // Two clusters mapped to the same component (a broken map) still get one each.
        const one = fixture.approved[0];
        const other = { signature: "another-cluster", name: "Validationwebinycom/Something Else" };
        const plan = planComponentCopy({
            approved: [one, other],
            siteComponents: fixture.siteComponents,
            bySignature: { [one.signature]: idOf(one.name), [other.signature]: idOf(one.name) }
        });
        expect(plan[0].updateId).toBe(idOf(one.name));
        expect(plan[1].updateId).toBeNull();
    });

    it("updates the component holding a name rather than renaming another onto it", () => {
        // The mapped component is a leftover; another already holds the approved name.
        const item = fixture.approved[0];
        const leftover = fixture.siteComponents.find(
            c => c.name !== item.name && !fixture.approved.some(a => a.name === c.name)
        )!;
        const plan = planComponentCopy({
            approved: [item],
            siteComponents: fixture.siteComponents,
            bySignature: { [item.signature]: leftover.id }
        });
        expect(plan[0].updateId).toBe(idOf(item.name));
    });
});
