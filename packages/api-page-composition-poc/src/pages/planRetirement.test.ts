import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { PageMapEntry } from "~/domain/types.js";
import { planRetirement } from "./planRetirement.js";

/*
 * The page maps of Take 3's site build and its rebuild, both in tenant parkcitytake380cd: the rebuild's
 * retirement saw exactly these.
 */
const fixture = JSON.parse(
    readFileSync(new URL("./__fixtures__/take3-site-rebuild-pagemaps.json", import.meta.url), "utf8")
) as { first: PageMapEntry[]; rebuild: PageMapEntry[] };
const assembledUrls = fixture.first.map(page => page.sourceUrl);
const amenities = "/apartments/ct/bridgeport/amenities";

describe("planRetirement", () => {
    it("replaces every earlier page when the rebuild composes every path, as Take 3's did", () => {
        const plan = planRetirement({
            earlier: fixture.first,
            created: fixture.rebuild,
            assembledUrls
        });
        expect(plan.unpublish.map(page => page.pageId)).toEqual(
            fixture.first.map(page => page.pageId)
        );
        expect(plan.kept).toEqual([]);
        expect(plan.dropped).toEqual([]);
    });

    it("keeps the earlier page up when its path fails to compose this time", () => {
        const plan = planRetirement({
            earlier: fixture.first,
            created: fixture.rebuild.filter(page => page.path !== amenities),
            assembledUrls
        });
        expect(plan.kept.map(page => page.path)).toEqual([amenities]);
        expect(plan.unpublish.map(page => page.path)).not.toContain(amenities);
        expect(plan.unpublish).toHaveLength(7);
    });

    it("unpublishes a page the run no longer assembles, and names it", () => {
        const plan = planRetirement({
            earlier: fixture.first,
            created: fixture.rebuild.filter(page => page.path !== amenities),
            assembledUrls: fixture.first
                .filter(page => page.path !== amenities)
                .map(page => page.sourceUrl)
        });
        expect(plan.dropped.map(page => page.path)).toEqual([amenities]);
        expect(plan.unpublish.map(page => page.path)).toContain(amenities);
        expect(plan.kept).toEqual([]);
    });

    it("retires a kept page once its path composes again", () => {
        // Build 2 kept the first build's amenities page; build 3 composes amenities again.
        const kept = fixture.first.filter(page => page.path === amenities);
        const plan = planRetirement({
            earlier: [...fixture.rebuild.filter(page => page.path !== amenities), ...kept],
            created: fixture.first.map(page => ({ ...page, pageId: `${page.entryId}#0002` })),
            assembledUrls
        });
        expect(plan.unpublish.map(page => page.pageId)).toContain(kept[0].pageId);
        expect(plan.kept).toEqual([]);
    });

    it("keeps one page per path, the most recent, when two earlier ones could be kept", () => {
        const plan = planRetirement({
            earlier: [
                ...fixture.rebuild.filter(page => page.path === amenities),
                ...fixture.first.filter(page => page.path === amenities)
            ],
            created: [],
            assembledUrls
        });
        expect(plan.kept.map(page => page.pageId)).toEqual(
            fixture.rebuild.filter(page => page.path === amenities).map(page => page.pageId)
        );
        expect(plan.unpublish.map(page => page.pageId)).toEqual(
            fixture.first.filter(page => page.path === amenities).map(page => page.pageId)
        );
    });
});
