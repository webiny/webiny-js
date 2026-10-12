import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { planJobDeletion, type JobDeletionInputs } from "./planJobDeletion.js";

interface FixtureJob {
    id: string;
    name: string;
    themeEntryId: string;
    extractedThemeEntryId: string | null;
    runs: Array<{
        id: string;
        approvals: Array<{
            tenantId?: string;
            promoted: Array<{ componentId: string; name: string }>;
        }>;
        images: number[];
    }>;
}

/* The dev instance on 2026-10-12: 27 jobs, 824 root pages, 266 root components, 357 image files. */
const fixture = JSON.parse(
    readFileSync(join(__dirname, "__fixtures__", "dev-instance-2026-10-12.json"), "utf8")
) as {
    jobs: FixtureJob[];
    imageTable: Array<[string, string, string]>;
    rootPages: JobDeletionInputs["rootPages"];
    rootComponents: JobDeletionInputs["rootComponents"];
};

const imagesOf = (job: FixtureJob) =>
    job.runs.flatMap(run =>
        run.images.map(index => {
            const [fileId, sha256, sourceUrl] = fixture.imageTable[index]!;
            return { fileId, sha256, sourceUrl };
        })
    );

/** The planner's inputs for one job, with every other job as "others", as the reader builds them. */
const inputsFor = (name: string): JobDeletionInputs => {
    const job = fixture.jobs.find(candidate => candidate.name === name)!;
    const others = fixture.jobs.filter(candidate => candidate.id !== job.id);
    return {
        job: {
            id: job.id,
            name: job.name,
            themeEntryId: job.themeEntryId,
            extractedThemeEntryId: job.extractedThemeEntryId
        },
        approvals: job.runs.flatMap(run =>
            run.approvals.map(approval => ({ runId: run.id, ...approval }))
        ),
        images: imagesOf(job),
        mappedEntryIds: [],
        referenceFileIds: [],
        others: {
            componentIds: others.flatMap(other =>
                other.runs.flatMap(run =>
                    run.approvals.flatMap(approval =>
                        approval.promoted.map(promoted => promoted.componentId)
                    )
                )
            ),
            themeEntryIds: others.map(other => other.themeEntryId),
            imageFileIds: others.flatMap(other => imagesOf(other).map(image => image.fileId))
        },
        activeThemeEntryId: null,
        rootPages: fixture.rootPages,
        rootComponents: fixture.rootComponents
    };
};

/** One of the job's approved components that is still in root's Library. */
const inLibrary = (inputs: JobDeletionInputs) => {
    const library = new Set(inputs.rootComponents.map(component => component.id));
    return inputs.approvals
        .flatMap(approval => approval.promoted)
        .find(promoted => library.has(promoted.componentId))!;
};

describe("deleting a job takes only what no other job uses", () => {
    it("keeps the images the other 2424 Tulane jobs share, and deletes the one only it used", () => {
        const plan = planJobDeletion(inputsFor("2424 Tulane"));
        // 88 files touched; 87 are also used by the four other 2424 Tulane jobs.
        expect(
            new Set(
                imagesOf(fixture.jobs.find(job => job.name === "2424 Tulane")!).map(
                    image => image.fileId
                )
            ).size
        ).toBe(88);
        expect(plan.images.delete).toHaveLength(1);
        expect(plan.images.keptShared).toBe(87);
    });

    it("deletes every image of a job no other job shares", () => {
        const plan = planJobDeletion(inputsFor("TheVibe Baseline"));
        expect(plan.images.delete).toHaveLength(164);
        expect(plan.images.keptShared).toBe(2);
    });

    it("keeps an extracted theme another job pins, and says so", () => {
        const plan = planJobDeletion(inputsFor("webiny.com, theme from the site (2026-10-09)"));
        expect(plan.theme).toEqual({
            delete: null,
            kept: "Extracted by this job, and pinned by one other job."
        });
    });

    it("deletes a theme the job extracted and nothing else pins", () => {
        const plan = planJobDeletion(inputsFor("ParkCity - Take 3"));
        expect(plan.theme).toEqual({ delete: "6aca042ec8568b0002a13f86", kept: null });
    });

    it("never deletes a theme the job chose from the list", () => {
        const plan = planJobDeletion(inputsFor("Theme failure check (2026-10-09)"));
        expect(plan.theme.delete).toBeNull();
        expect(plan.theme.kept).toBe("Chosen from the existing themes, not extracted by this job.");
    });

    it("leaves root alone for components approved into the site tenant", () => {
        const inputs = inputsFor("Rehearsal — site tenant (2026-10-12)");
        // A root page using a name its site-tenant approval also has is some other job's page.
        const siteName = inputs.approvals[0]!.promoted[0]!.name;
        const rootPage = { id: "root-page#0001", deleted: false, names: ["Webiny/Root", siteName] };
        const plan = planJobDeletion({ ...inputs, rootPages: [...inputs.rootPages, rootPage] });
        expect(plan.components.delete).toEqual([]);
        expect(plan.pages.ids).toEqual([]);
    });
});

describe("the job's pages and components in root", () => {
    it("finds the pages composed from the job's components alone, live and in the bin", () => {
        const plan = planJobDeletion(inputsFor("2424 Tulane"));
        expect(plan.pages.ids).toHaveLength(220);
        expect(plan.pages.live + plan.pages.binned).toBe(220);
        // Every component it deletes is in root's Library and named by no page that stays.
        const library = new Set(fixture.rootComponents.map(component => component.id));
        const kept = fixture.rootPages.filter(page => !plan.pages.ids.includes(page.id));
        for (const component of plan.components.delete) {
            expect(library.has(component.id)).toBe(true);
            expect(kept.some(page => page.names.includes(component.name))).toBe(false);
        }
    });

    it("keeps a page that also names another job's component, and the component it names", () => {
        const inputs = inputsFor("2424 Tulane");
        const own = inLibrary(inputs);
        const othersName = fixture.jobs
            .find(job => job.name === "Park city Palace")!
            .runs.flatMap(run => run.approvals.flatMap(approval => approval.promoted))[0]!.name;
        const mixed = {
            id: "mixed#0001",
            deleted: false,
            names: ["Webiny/Root", own.name, othersName]
        };
        const plan = planJobDeletion({ ...inputs, rootPages: [...inputs.rootPages, mixed] });
        expect(plan.pages.ids).not.toContain("mixed#0001");
        expect(plan.components.delete.map(component => component.id)).not.toContain(
            own.componentId
        );
        expect(plan.components.keptUsed.find(item => item.name === own.name)?.pages).toBe(1);
    });

    it("finds a page its map recorded even after the page moved to a later revision", () => {
        const inputs = inputsFor("TheVibe Baseline");
        // Mapped as revision #0001 when composed; the listing now returns its #0003.
        const edited = {
            id: "6acmapped0001#0003",
            deleted: false,
            names: ["Webiny/Root", "Hand/Made"]
        };
        const plan = planJobDeletion({
            ...inputs,
            mappedEntryIds: ["6acmapped0001"],
            rootPages: [...inputs.rootPages, edited]
        });
        expect(plan.pages.ids).toContain("6acmapped0001#0003");
    });

    it("keeps a component another job's approval also holds", () => {
        const inputs = inputsFor("2424 Tulane");
        const own = inLibrary(inputs);
        const plan = planJobDeletion({
            ...inputs,
            others: {
                ...inputs.others,
                componentIds: [...inputs.others.componentIds, own.componentId]
            }
        });
        expect(plan.components.keptShared).toContain(own.name);
        expect(plan.components.delete.map(component => component.id)).not.toContain(
            own.componentId
        );
    });
});
