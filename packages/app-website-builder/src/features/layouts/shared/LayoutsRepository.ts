import { makeAutoObservable, observable, runInAction } from "mobx";
import { parseIdentifier } from "@webiny/utils/parseIdentifier.js";
import { WbPageStatus } from "~/constants.js";
import {
    type CreateLayoutData,
    type Layout,
    type LayoutSettings,
    LayoutsGateway,
    LayoutsRepository as RepositoryAbstraction,
    type UpdateLayoutData
} from "./abstractions.js";
import { isLayoutNotFoundError } from "./errors.js";

const byTitle = (a: Layout, b: Layout) => {
    return (a.properties.title || "").localeCompare(b.properties.title || "");
};

const byVersionDesc = (a: Layout, b: Layout) => b.version - a.version;

class LayoutsRepositoryImpl implements RepositoryAbstraction.Interface {
    public layouts: Layout[] = [];
    public loading = false;
    public settings: LayoutSettings | null = null;
    private revisions = observable.map<string, Layout[]>();

    constructor(private gateway: LayoutsGateway.Interface) {
        makeAutoObservable<LayoutsRepositoryImpl, "gateway">(
            this,
            { gateway: false },
            { autoBind: true }
        );
    }

    getLoadedRevisions(entryId: string) {
        return this.revisions.get(entryId) ?? [];
    }

    async list() {
        this.loading = true;
        try {
            const layouts = await this.gateway.list();
            runInAction(() => {
                this.layouts = [...layouts].sort(byTitle);
            });
            return layouts;
        } finally {
            runInAction(() => {
                this.loading = false;
            });
        }
    }

    get(id: string) {
        return this.gateway.get(id);
    }

    async getRevisions(entryId: string) {
        const revisions = await this.gateway.getRevisions(entryId);
        runInAction(() => {
            this.revisions.set(entryId, [...revisions].sort(byVersionDesc));
        });
        return revisions;
    }

    getPageLayout(layoutId: string, language: string | null) {
        return this.gateway.getPageLayout(layoutId, language);
    }

    async getSettings() {
        const settings = await this.gateway.getSettings();
        runInAction(() => {
            this.settings = settings;
        });
        return settings;
    }

    async create(data: CreateLayoutData) {
        const layout = await this.gateway.create(data);
        this.setLatest(layout);
        return layout;
    }

    async update(id: string, data: UpdateLayoutData) {
        const layout = await this.gateway.update(id, data);
        runInAction(() => {
            this.layouts = this.layouts
                .map(item => (item.id === layout.id ? layout : item))
                .sort(byTitle);
            this.updateRevisions(layout.entryId, item => (item.id === layout.id ? layout : item));
        });
        return layout;
    }

    async publish(id: string) {
        const published = await this.gateway.publish(id);

        // Only one revision of an entry is published, so the one published before it is now unpublished.
        const apply = (item: Layout): Layout => {
            if (item.id === published.id) {
                return published;
            }
            return {
                ...item,
                live: { version: published.version },
                status:
                    item.status === WbPageStatus.Published ? WbPageStatus.Unpublished : item.status
            };
        };

        runInAction(() => {
            this.layouts = this.layouts.map(item =>
                item.entryId === published.entryId ? apply(item) : item
            );
            this.updateRevisions(published.entryId, apply);
        });
        return published;
    }

    async unpublish(id: string) {
        const unpublished = await this.gateway.unpublish(id);

        const apply = (item: Layout): Layout => {
            return item.id === unpublished.id ? unpublished : { ...item, live: null };
        };

        runInAction(() => {
            this.layouts = this.layouts.map(item =>
                item.entryId === unpublished.entryId ? apply(item) : item
            );
            this.updateRevisions(unpublished.entryId, apply);
        });
        return unpublished;
    }

    async createRevisionFrom(id: string) {
        const revision = await this.gateway.createRevisionFrom(id);
        runInAction(() => {
            this.setLatest(revision);
            const revisions = this.revisions.get(revision.entryId);
            if (revisions) {
                this.revisions.set(
                    revision.entryId,
                    [revision, ...revisions.filter(item => item.id !== revision.id)].sort(
                        byVersionDesc
                    )
                );
            }
        });
        return revision;
    }

    async deleteRevision(id: string) {
        await this.gateway.deleteRevision(id);
        const entryId = parseIdentifier(id).id;

        runInAction(() => {
            const revisions = this.revisions.get(entryId);
            if (revisions) {
                this.revisions.set(
                    entryId,
                    revisions.filter(item => item.id !== id)
                );
            }
        });

        if (!this.layouts.some(item => item.entryId === entryId)) {
            return;
        }

        // The entry's latest revision, and whether it's live, may have changed: reload it.
        try {
            const latest = await this.gateway.get(entryId);
            this.setLatest(latest);
        } catch (error) {
            // Any other failure leaves the layout listed as it was: the revision is deleted all the same.
            if (!isLayoutNotFoundError(error)) {
                return;
            }
            // The entry's last revision was deleted, so the entry is gone.
            runInAction(() => {
                this.layouts = this.layouts.filter(item => item.entryId !== entryId);
            });
        }
    }

    async delete(entryId: string) {
        await this.gateway.delete(entryId);

        runInAction(() => {
            // A source layout's language versions are deleted with it.
            const deleted = this.layouts.filter(
                item => item.entryId === entryId || item.properties.sourceLayout === entryId
            );
            const deletedIds = new Set([entryId, ...deleted.map(item => item.entryId)]);

            this.layouts = this.layouts.filter(item => !deletedIds.has(item.entryId));
            for (const id of deletedIds) {
                this.revisions.delete(id);
            }

            if (this.settings?.defaultLayout === entryId) {
                this.settings = { defaultLayout: null };
            }
        });
    }

    async duplicate(id: string) {
        const layout = await this.gateway.duplicate(id);
        this.setLatest(layout);
        return layout;
    }

    async translate(id: string, language: string) {
        const layout = await this.gateway.translate(id, language);
        this.setLatest(layout);
        return layout;
    }

    async setDefaultLayout(entryId: string | null) {
        const settings = await this.gateway.setDefaultLayout(entryId);
        runInAction(() => {
            this.settings = settings;
        });
        return settings;
    }

    // Make a revision the listed (latest) revision of its entry.
    private setLatest(layout: Layout) {
        runInAction(() => {
            this.layouts = [
                ...this.layouts.filter(item => item.entryId !== layout.entryId),
                layout
            ].sort(byTitle);
        });
    }

    private updateRevisions(entryId: string, map: (item: Layout) => Layout) {
        const revisions = this.revisions.get(entryId);
        if (revisions) {
            this.revisions.set(entryId, revisions.map(map));
        }
    }
}

export const LayoutsRepository = RepositoryAbstraction.createImplementation({
    implementation: LayoutsRepositoryImpl,
    dependencies: [LayoutsGateway]
});
