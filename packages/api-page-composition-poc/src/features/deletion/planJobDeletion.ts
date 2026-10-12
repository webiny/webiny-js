/**
 * What deleting a job removes from the extraction tenant, after the sharing checks.
 *
 * A job leaves things in root that other jobs may also use: images are stored once per content, so
 * every job of the same site points at the same files; a theme extracted by one job can be pinned by
 * another; a component can be named by a page some other job composed. Deleting what the job TOUCHED
 * would take those from under the others without a word. This decides what goes, and the dialog's
 * counts are this plan's, so the number shown is the number deleted: no more, no less.
 *
 * Pure, so it is tested on the dev instance's real jobs, pages and images.
 */

/** Components the platform provides, which every page names and no job owns. */
const PLATFORM_PREFIX = "Webiny/";

export interface DeletionJob {
    id: string;
    name: string;
    /** The pinned theme. */
    themeEntryId: string;
    /** The theme this job extracted itself, if it did. A theme picked from the list is not its own. */
    extractedThemeEntryId: string | null;
}

/** One version of one run's Promote artifact. */
export interface DeletionApproval {
    runId: string;
    /** Set when the components went into the site tenant; those go with the tenant, not from root. */
    tenantId?: string;
    promoted: Array<{ componentId: string; name: string }>;
}

/** An image one of the job's runs used, migrated or deduplicated. */
export interface DeletionImage {
    fileId: string;
    sha256: string;
    sourceUrl: string;
}

/** A page in root, live or in the bin, with the components its elements name. */
export interface DeletionPage {
    /** The latest revision's id, which is what a delete takes. */
    id: string;
    /** Stable across revisions; read from the id when absent. */
    entryId?: string;
    deleted: boolean;
    names: string[];
}

export interface JobDeletionInputs {
    job: DeletionJob;
    approvals: DeletionApproval[];
    images: DeletionImage[];
    /** Pages this job's root page maps record, by entry id: a map holds the revision it created. */
    mappedEntryIds: string[];
    /** Reference images whose metadata names one of this job's runs. */
    referenceFileIds: string[];
    /** What every OTHER job uses, by id. */
    others: { componentIds: string[]; themeEntryIds: string[]; imageFileIds: string[] };
    activeThemeEntryId: string | null;
    rootPages: DeletionPage[];
    rootComponents: Array<{ id: string; name: string }>;
}

export interface RootDeletionPlan {
    pages: { ids: string[]; live: number; binned: number };
    components: {
        delete: Array<{ id: string; name: string }>;
        /** Also in another job's approval (a Replace across jobs). */
        keptShared: string[];
        /** Named by a page that is not being deleted. */
        keptUsed: Array<{ name: string; pages: number }>;
    };
    images: {
        delete: Array<{ fileId: string; sha256s: string[]; sourceUrls: string[] }>;
        /** Files another job's runs also use. */
        keptShared: number;
    };
    referenceFileIds: string[];
    theme: { delete: string | null; kept: string | null };
}

const pageNames = (page: DeletionPage): string[] =>
    page.names.filter(name => !name.startsWith(PLATFORM_PREFIX));

export const planJobDeletion = (inputs: JobDeletionInputs): RootDeletionPlan => {
    const otherComponents = new Set(inputs.others.componentIds);
    const existing = new Map(inputs.rootComponents.map(component => [component.id, component]));

    // The job's components in root, by the name pages address them with.
    const ownIdByName = new Map<string, string>();
    for (const approval of inputs.approvals) {
        if (approval.tenantId) {
            continue;
        }
        for (const promoted of approval.promoted) {
            ownIdByName.set(promoted.name, promoted.componentId);
        }
    }
    const ownIds = new Set(ownIdByName.values());

    /*
     * The job's pages: the ones its page maps record, and the ones composed from its components
     * alone. The page map keeps only the latest composition, so an earlier one is found by what it
     * names: every component on it is this job's, and none is shared with another job. A page naming
     * anything else is someone else's, or was built by hand, and stays.
     */
    const mapped = new Set(inputs.mappedEntryIds);
    const isOwnPage = (page: DeletionPage): boolean => {
        if (mapped.has(page.entryId ?? page.id.split("#")[0]!)) {
            return true;
        }
        const names = pageNames(page);
        return (
            names.length > 0 &&
            names.every(name => {
                const id = ownIdByName.get(name);
                return id !== undefined && !otherComponents.has(id);
            })
        );
    };
    const ownPages = inputs.rootPages.filter(isOwnPage);
    const ownPageIds = new Set(ownPages.map(page => page.id));
    const remainingPages = inputs.rootPages.filter(page => !ownPageIds.has(page.id));

    // Components: the job's, still in the Library, not shared, and named by no page that stays.
    const usedBy = new Map<string, number>();
    for (const page of remainingPages) {
        for (const name of new Set(pageNames(page))) {
            usedBy.set(name, (usedBy.get(name) ?? 0) + 1);
        }
    }
    const componentsDelete: Array<{ id: string; name: string }> = [];
    const keptShared: string[] = [];
    const keptUsed: Array<{ name: string; pages: number }> = [];
    for (const id of ownIds) {
        const component = existing.get(id);
        if (!component) {
            continue;
        }
        if (otherComponents.has(id)) {
            keptShared.push(component.name);
            continue;
        }
        const pages = usedBy.get(component.name) ?? 0;
        if (pages > 0) {
            keptUsed.push({ name: component.name, pages });
            continue;
        }
        componentsDelete.push(component);
    }

    // Images: a file goes only when no other job's run uses it.
    const otherImages = new Set(inputs.others.imageFileIds);
    const byFile = new Map<
        string,
        { fileId: string; sha256s: Set<string>; sourceUrls: Set<string> }
    >();
    for (const image of inputs.images) {
        const entry = byFile.get(image.fileId) ?? {
            fileId: image.fileId,
            sha256s: new Set<string>(),
            sourceUrls: new Set<string>()
        };
        entry.sha256s.add(image.sha256);
        entry.sourceUrls.add(image.sourceUrl);
        byFile.set(image.fileId, entry);
    }
    const imagesDelete: RootDeletionPlan["images"]["delete"] = [];
    let imagesShared = 0;
    for (const entry of byFile.values()) {
        if (otherImages.has(entry.fileId)) {
            imagesShared += 1;
            continue;
        }
        imagesDelete.push({
            fileId: entry.fileId,
            sha256s: [...entry.sha256s],
            sourceUrls: [...entry.sourceUrls]
        });
    }

    return {
        pages: {
            ids: ownPages.map(page => page.id),
            live: ownPages.filter(page => !page.deleted).length,
            binned: ownPages.filter(page => page.deleted).length
        },
        components: { delete: componentsDelete, keptShared, keptUsed },
        images: { delete: imagesDelete, keptShared: imagesShared },
        referenceFileIds: [...new Set(inputs.referenceFileIds)],
        theme: planTheme(inputs)
    };
};

/** The job's own theme goes, unless another job pins it or it is active; a chosen theme stays. */
const planTheme = (inputs: JobDeletionInputs): RootDeletionPlan["theme"] => {
    const own = inputs.job.extractedThemeEntryId;
    if (!own) {
        return {
            delete: null,
            kept: inputs.job.themeEntryId
                ? "Chosen from the existing themes, not extracted by this job."
                : null
        };
    }
    const pinnedBy = inputs.others.themeEntryIds.filter(id => id === own).length;
    if (pinnedBy > 0) {
        return {
            delete: null,
            kept:
                pinnedBy === 1
                    ? "Extracted by this job, and pinned by one other job."
                    : `Extracted by this job, and pinned by ${pinnedBy} other jobs.`
        };
    }
    if (inputs.activeThemeEntryId === own) {
        return { delete: null, kept: "Extracted by this job, and active in this tenant." };
    }
    return { delete: own, kept: null };
};
