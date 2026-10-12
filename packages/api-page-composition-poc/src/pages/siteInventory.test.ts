import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { siteInventory } from "./siteInventory.js";

/*
 * The validation site's tenant after two builds: 3 published pages, the first build's 3 unpublished
 * copies, and the 6 components its pages place.
 */
const fixture = JSON.parse(
    readFileSync(new URL("./__fixtures__/validation-site-tenant.json", import.meta.url), "utf8")
) as {
    pages: Array<{ status: string; path: string; elements: Record<string, unknown> }>;
    components: string[];
};

describe("siteInventory", () => {
    it("counts the earlier builds' unpublished copies, and no unused component when every one is placed", () => {
        expect(
            siteInventory({ pages: fixture.pages, componentNames: fixture.components })
        ).toEqual({ components: 6, unused: [], publishedPages: 3, unpublishedPages: 3 });
    });

    it("names a component no published page places, as a re-approval leaves one", () => {
        // A re-approval publishes `Name (2)`; the site keeps `Name`, which no live page places.
        const inventory = siteInventory({
            pages: fixture.pages,
            componentNames: [...fixture.components, "Validationwebinycom/Headline Hero with CTAs (2)"]
        });
        expect(inventory.unused).toEqual(["Validationwebinycom/Headline Hero with CTAs (2)"]);
    });

    it("does not count a component placed only by an unpublished page as used", () => {
        const published = fixture.pages.filter(page => page.status === "published");
        const unpublished = fixture.pages.filter(page => page.status !== "published");
        const inventory = siteInventory({
            // The live pages lose the hero; only the earlier copies still place it.
            pages: [
                ...published.map(page => ({
                    ...page,
                    elements: Object.fromEntries(
                        Object.entries(page.elements).filter(
                            ([, element]) =>
                                (element as { component?: { name?: string } }).component?.name !==
                                "Validationwebinycom/Headline Hero with CTAs"
                        )
                    )
                })),
                ...unpublished
            ],
            componentNames: fixture.components
        });
        expect(inventory.unused).toEqual(["Validationwebinycom/Headline Hero with CTAs"]);
    });
});
