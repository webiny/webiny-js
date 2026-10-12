import { describe, expect, it } from "vitest";
import type { JobDeletionDto } from "~/shared/types.js";
import { deleteJobLines } from "./deleteJobLines.js";

/*
 * The counts the planner gives on the dev instance's real data (2026-10-12): 2424 Tulane touches 88
 * images and 87 are the other 2424 Tulane jobs' too; 220 of root's pages are its compositions.
 */
const tulane: JobDeletionDto["plan"] = {
    status: "done",
    error: null,
    computedOn: "2026-10-12T19:00:00.000Z",
    blocked: null,
    runs: 4,
    modelCalls: 651,
    corrections: 0,
    root: {
        pages: 220,
        pagesLive: 33,
        pagesBinned: 187,
        components: 27,
        componentsKeptShared: 0,
        componentsKeptUsed: 0,
        images: 1,
        imagesKeptShared: 87,
        referenceImages: 0,
        themeDeleted: false,
        themeKept: "Chosen from the existing themes, not extracted by this job."
    },
    site: null
};

/*
 * The 71 Westland rehearsal: 50 model calls, 16 components, its own theme, and a live site of 10 pages
 * and 16 components (its inventory) holding the 48 image files its Site step records.
 */
const westland: JobDeletionDto["plan"] = {
    ...tulane,
    runs: 1,
    modelCalls: 50,
    root: {
        ...tulane.root!,
        pages: 0,
        pagesLive: 0,
        pagesBinned: 0,
        components: 16,
        images: 1,
        imagesKeptShared: 47,
        themeDeleted: true,
        themeKept: null
    },
    site: {
        tenantId: "71westlandrehearsal202614962",
        exists: true,
        live: true,
        pages: 10,
        publishedPages: 10,
        components: 16,
        files: 48,
        themes: 1
    }
};

describe("the delete dialog's lines", () => {
    it("counts what goes after the sharing checks, and says what other jobs keep", () => {
        const lines = deleteJobLines(tulane);
        expect(lines.removes).toContain("1 image only this job used");
        expect(lines.removes.join(" ")).not.toMatch(/88/);
        expect(lines.keeps).toContain("87 images: other jobs use them too.");
        expect(lines.removes).toContain(
            "220 composed pages in root (33 not in the bin, 187 in it)"
        );
        expect(lines.keeps).toContain(
            "The theme: chosen from the existing themes, not extracted by this job."
        );
    });

    it("offers a live site as a choice, naming what goes before the tenant", () => {
        const lines = deleteJobLines(westland);
        expect(lines.site).toEqual({
            kind: "choice",
            text: "Also delete the site: its 10 pages, 16 components, 48 files and 1 theme, then the tenant 71westlandrehearsal202614962."
        });
        expect(lines.removes).toContain("The theme this job extracted");
    });

    it("lists a site with nothing published as going with the job, not as a choice", () => {
        const lines = deleteJobLines({
            ...westland,
            site: { ...westland.site!, live: false, publishedPages: 0 }
        });
        expect(lines.site?.kind).toBe("included");
    });

    it("leaves out what has none, rather than listing a zero", () => {
        const lines = deleteJobLines({
            ...tulane,
            root: { ...tulane.root!, pages: 0, components: 0, referenceImages: 0 }
        });
        expect(lines.removes.join(" ")).not.toMatch(/\b0 /);
    });
});
