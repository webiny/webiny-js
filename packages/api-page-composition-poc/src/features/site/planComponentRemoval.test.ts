import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { planComponentRemoval } from "./planComponentRemoval.js";

/*
 * The validation site's tenant (3 published pages, 3 unpublished copies, 6 components), read
 * 2026-10-12, with one component left over from a re-approval added.
 */
const fixture = JSON.parse(
    readFileSync(new URL("../../pages/__fixtures__/validation-site-tenant.json", import.meta.url), "utf8")
) as {
    pages: Array<{ status: string; elements: Record<string, { component?: { name?: string } }> }>;
    components: string[];
};
const components = [...fixture.components, "Validationwebinycom/Headline Hero with CTAs (2)"].map(
    (name, index) => ({ id: `c${index}`, name })
);
const idOf = (name: string) => components.find(c => c.name === name)!.id;
const placing = (name: string) =>
    fixture.pages.filter(page =>
        Object.values(page.elements).some(element => element.component?.name === name)
    );
const hero = "Validationwebinycom/Headline Hero with CTAs";
const leftover = "Validationwebinycom/Headline Hero with CTAs (2)";
const live = fixture.components.filter(name => name !== hero);

describe("planComponentRemoval", () => {
    it("removes a component no page names and the approval does not hold", () => {
        const removed = planComponentRemoval({
            pages: fixture.pages,
            components,
            approvedIds: fixture.components.map(idOf)
        });
        expect(removed.map(c => c.name)).toEqual([leftover]);
    });

    it("keeps a component only a draft names", () => {
        // A draft placing the leftover; nothing else does, and the approval does not hold it.
        const draft = {
            status: "draft",
            elements: { a: { component: { name: leftover } } }
        };
        const removed = planComponentRemoval({
            pages: [...fixture.pages, draft],
            components,
            approvedIds: fixture.components.map(idOf)
        });
        expect(removed).toEqual([]);
    });

    it("keeps a component only an unpublished page names", () => {
        const publishedOnly = fixture.pages.filter(page => page.status === "published");
        const unpublished = fixture.pages.filter(page => page.status !== "published");
        expect(placing(hero).some(page => page.status !== "published")).toBe(true);
        const removed = planComponentRemoval({
            // The live pages drop the hero; only the unpublished copies still name it.
            pages: [
                ...publishedOnly.map(page => ({
                    ...page,
                    elements: Object.fromEntries(
                        Object.entries(page.elements).filter(([, e]) => e.component?.name !== hero)
                    )
                })),
                ...unpublished
            ],
            components,
            approvedIds: live.map(idOf)
        });
        expect(removed.map(c => c.name)).toEqual([leftover]);
    });

    it("keeps the approval being published even if no page names it yet", () => {
        const removed = planComponentRemoval({
            pages: [],
            components,
            approvedIds: [idOf(leftover)]
        });
        expect(removed.map(c => c.name)).not.toContain(leftover);
        expect(removed).toHaveLength(components.length - 1);
    });
});
