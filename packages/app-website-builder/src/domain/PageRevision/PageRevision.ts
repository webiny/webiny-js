import { type WbStatus } from "~/constants.js";
import { toTitleCaseLabel } from "~/shared/toTitleCaseLabel.js";
import type { Page } from "~/domain/Page/Page.js";
import type { WbIdentity } from "~/types.js";

export interface PageRevisionData {
    id: string;
    entryId: string;
    status: WbStatus;
    version: number;
    savedOn: string;
    title: string;
    locked: boolean;
    createdBy: WbIdentity;
    createdOn: string;
    revisionDescription: string | undefined;
}

export class PageRevision {
    public readonly id: string;
    public readonly entryId: string;
    public readonly status: WbStatus;
    public readonly version: number;
    public readonly savedOn: string;
    public readonly title: string;
    public readonly locked: boolean;
    public readonly createdBy: WbIdentity;
    public readonly createdOn: string;
    public readonly revisionDescription: string | undefined;

    protected constructor(data: PageRevisionData) {
        this.id = data.id;
        this.entryId = data.entryId;
        this.status = data.status;
        this.version = data.version;
        this.savedOn = data.savedOn;
        this.title = data.title;
        this.locked = data.locked;
        this.createdBy = data.createdBy;
        this.createdOn = data.createdOn;
        this.revisionDescription = data.revisionDescription;
    }

    getLabel() {
        return `v${this.version} (${toTitleCaseLabel(this.status)})`;
    }

    /**
     * Publishing a revision unpublishes the one that was published before it, so the list needs
     * to reflect the new status without refetching.
     */
    withStatus(status: WbStatus) {
        return new PageRevision({ ...this, status });
    }

    static create(data: PageRevisionData) {
        return new PageRevision(data);
    }

    /**
     * A page revision is a projection of a page, so mutations that return a `Page` (for example,
     * creating a new revision) can be reflected in the revisions cache without an extra round trip.
     */
    static createFromPage(page: Page) {
        return new PageRevision({
            id: page.id,
            entryId: page.entryId,
            status: page.status,
            version: page.version,
            savedOn: page.savedOn,
            title: page.properties.title,
            locked: page.locked,
            createdBy: page.createdBy,
            createdOn: page.createdOn,
            revisionDescription: page.revisionDescription
        });
    }
}
