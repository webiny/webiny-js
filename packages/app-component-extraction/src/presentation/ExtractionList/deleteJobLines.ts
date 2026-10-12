import type { JobDeletionDto } from "~/shared/types.js";

/** Said once, because it is true of every item: nothing a job delete removes can be restored. */
export const FINALITY = "This can't be undone. Nothing here goes to a bin.";

/** A tenant delete cannot promise completeness; this is what it does not cover. */
export const TENANT_LEFTOVERS =
    "Anything else in the tenant, such as users or content entries, is not deleted and can't be reached afterwards.";

/** Why a live site blocks the delete until it is chosen too. */
export const LIVE_SITE_REFUSAL =
    "This job's site is live. Delete the site with it, or keep the job.";

const count = (n: number, one: string, many: string = `${one}s`): string =>
    `${n} ${n === 1 ? one : many}`;

export interface DeleteJobLines {
    /** What goes from the extraction workspace, one line per kind that has any. */
    removes: string[];
    /** What stays and why: shared with other jobs, or kept by design. */
    keeps: string[];
    /**
     * The site: a choice when it is live, a listed item when nothing of it is published, the record
     * alone when its tenant is already gone.
     */
    site: { kind: "choice" | "included" | "record"; text: string } | null;
}

const siteContents = (site: NonNullable<JobDeletionDto["plan"]["site"]>): string =>
    `its ${count(site.pages, "page")}, ${count(site.components, "component")}, ${count(
        site.files,
        "file"
    )} and ${count(site.themes, "theme")}, then the tenant ${site.tenantId}`;

/**
 * The dialog's lines, from the counts after the sharing checks: the numbers are what will go, not
 * what the job touched. A count of zero is left out rather than listed.
 */
export const deleteJobLines = (plan: JobDeletionDto["plan"]): DeleteJobLines => {
    const removes: string[] = [];
    const keeps: string[] = [];

    removes.push(
        `${count(plan.runs, "run")}, their stage outputs and ${count(
            plan.modelCalls,
            "model-call record"
        )} (spend history)`
    );

    const root = plan.root;
    if (root) {
        if (root.pages > 0) {
            const where =
                root.pagesBinned === 0
                    ? ""
                    : root.pagesLive === 0
                      ? ", all in the bin"
                      : ` (${root.pagesLive} not in the bin, ${root.pagesBinned} in it)`;
            removes.push(`${count(root.pages, "composed page")} in root${where}`);
        }
        if (root.components > 0) {
            removes.push(`${count(root.components, "component")} from root's Library`);
        }
        if (root.images > 0) {
            removes.push(`${count(root.images, "image")} only this job used`);
        }
        if (root.referenceImages > 0) {
            removes.push(`${count(root.referenceImages, "reference image")}`);
        }
        if (root.themeDeleted) {
            removes.push("The theme this job extracted");
        }

        if (root.imagesKeptShared > 0) {
            keeps.push(`${count(root.imagesKeptShared, "image")}: other jobs use them too.`);
        }
        if (root.componentsKeptShared > 0) {
            keeps.push(
                `${count(root.componentsKeptShared, "component")}: another job approved them too.`
            );
        }
        if (root.componentsKeptUsed > 0) {
            keeps.push(
                `${count(root.componentsKeptUsed, "component")}: pages of other jobs use them.`
            );
        }
        if (root.themeKept) {
            keeps.push(
                `The theme: ${root.themeKept.charAt(0).toLowerCase()}${root.themeKept.slice(1)}`
            );
        }
    }
    if (plan.corrections > 0) {
        keeps.push(
            `${count(plan.corrections, "correction")}: the correction log keeps them, to tune extraction against.`
        );
    }

    let site: DeleteJobLines["site"] = null;
    if (plan.site) {
        if (!plan.site.exists) {
            site = {
                kind: "record",
                text: `The record of its site; the tenant ${plan.site.tenantId} is already gone`
            };
        } else if (plan.site.live) {
            site = { kind: "choice", text: `Also delete the site: ${siteContents(plan.site)}.` };
        } else {
            site = {
                kind: "included",
                text: `Its site, which has no published pages: ${siteContents(plan.site)}`
            };
        }
    }

    return { removes, keeps, site };
};
