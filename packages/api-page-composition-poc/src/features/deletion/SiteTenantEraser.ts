import { createAbstraction } from "@webiny/feature/api";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { GetTenantByIdUseCase } from "@webiny/api-core/exports/api/tenancy.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { GetLatestRevisionByEntryIdIncludingDeletedUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetLatestRevisionByEntryId/index.js";
import { TENANT_MODEL_ID } from "@webiny/tenant-manager/shared/constants.js";
import { ListPagesUseCase } from "@webiny/api-website-builder/features/pages/ListPages/abstractions.js";
import type { WbPage } from "@webiny/api-website-builder/domain/page/abstractions.js";
import { ListDeletedPagesUseCase } from "@webiny/api-website-builder/features/pages/ListDeletedPages/abstractions.js";
import { DeletePageUseCase } from "@webiny/api-website-builder/features/pages/DeletePage/abstractions.js";
import { ListRemoteComponentsUseCase } from "@webiny/remote-components/api/features/listComponents/abstractions.js";
import { DeleteRemoteComponentUseCase } from "@webiny/remote-components/api/features/deleteComponent/abstractions.js";
import { ListFilesUseCase } from "@webiny/api-file-manager/features/file/ListFiles/abstractions.js";
import { DeleteFileUseCase } from "@webiny/api-file-manager/features/file/DeleteFile/abstractions.js";
import { ListThemesUseCase } from "@webiny/api-theme/features/ListThemes/index.js";
import { DeleteThemeUseCase } from "@webiny/api-theme/features/DeleteTheme/index.js";
import { ActiveThemeStore } from "@webiny/api-theme/features/ActiveThemeStore/index.js";

/** What a site tenant holds of the kinds a delete removes, and how many of its pages are live. */
export interface SiteContentCounts {
    pages: number;
    publishedPages: number;
    components: number;
    files: number;
    themes: number;
}

/** A loop that deletes until a listing comes back empty stops here instead of spinning. */
const MAX_ROUNDS = 20;

/**
 * A site tenant's content, then the tenant.
 *
 * Deleting a tenant removes its record and leaves everything in it in storage, unreachable: nothing
 * can address the tenant afterwards to list it (`deleting-a-tenant-leaves-its-content-unreachable-in-
 * storage.md`, seen on cespike1). So the content goes first, while the tenant can still be addressed,
 * each kind checked empty before the next; and the tenant goes only when every kind is. A kind not
 * walked here (users, content entries, key-value records) stays, which the dialog says.
 *
 * The tenant's Tenant Manager entry is deleted permanently, which is what deletes the tenant; its
 * handler swallows a failed delete, so the tenant's absence is checked afterwards, not assumed.
 */
export interface ISiteTenantEraser {
    /** The tenant if it still exists. */
    find(tenantId: string): Promise<Tenant | null>;
    count(tenant: Tenant): Promise<SiteContentCounts | string>;
    /** Every kind, each checked empty. A string says which kind did not empty, and stops there. */
    eraseContent(
        tenant: Tenant,
        report: (detail: string) => Promise<void>
    ): Promise<SiteContentCounts | string>;
    /** The Tenant Manager entry, then the check that the tenant is really gone. */
    eraseTenant(tenantId: string): Promise<true | string>;
}

export const SiteTenantEraser = createAbstraction<ISiteTenantEraser>(
    "PageCompositionPoc/SiteTenantEraser"
);
export namespace SiteTenantEraser {
    export type Interface = ISiteTenantEraser;
}

const reason = (error: { message?: string } | unknown): string =>
    (error as { message?: string })?.message ?? String(error);

class SiteTenantEraserImpl implements ISiteTenantEraser {
    constructor(
        private tenantContext: TenantContext.Interface,
        private getTenantById: GetTenantByIdUseCase.Interface,
        private getModel: GetModelUseCase.Interface,
        private deleteEntry: DeleteEntryUseCase.Interface,
        private getLatest: GetLatestRevisionByEntryIdIncludingDeletedUseCase.Interface,
        private listPages: ListPagesUseCase.Interface,
        private listDeletedPages: ListDeletedPagesUseCase.Interface,
        private deletePage: DeletePageUseCase.Interface,
        private listComponents: ListRemoteComponentsUseCase.Interface,
        private deleteComponent: DeleteRemoteComponentUseCase.Interface,
        private listFiles: ListFilesUseCase.Interface,
        private deleteFile: DeleteFileUseCase.Interface,
        private listThemes: ListThemesUseCase.Interface,
        private deleteTheme: DeleteThemeUseCase.Interface,
        private activeTheme: ActiveThemeStore.Interface
    ) {}

    async find(tenantId: string): Promise<Tenant | null> {
        const found = await this.getTenantById.execute(tenantId);
        return found.isOk() ? found.value : null;
    }

    async count(tenant: Tenant): Promise<SiteContentCounts | string> {
        return this.tenantContext.withTenant(tenant, async () => {
            const pages = await this.pageIds();
            if (typeof pages === "string") {
                return pages;
            }
            const components = await this.componentIds();
            if (typeof components === "string") {
                return components;
            }
            const files = await this.fileIds();
            if (typeof files === "string") {
                return files;
            }
            const themes = await this.themeIds();
            if (typeof themes === "string") {
                return themes;
            }
            return {
                pages: pages.all.length,
                publishedPages: pages.published,
                components: components.length,
                files: files.length,
                themes: themes.length
            };
        });
    }

    async eraseContent(
        tenant: Tenant,
        report: (detail: string) => Promise<void>
    ): Promise<SiteContentCounts | string> {
        return this.tenantContext.withTenant(tenant, async () => {
            const counts: SiteContentCounts = {
                pages: 0,
                publishedPages: 0,
                components: 0,
                files: 0,
                themes: 0
            };

            const pages = await this.emptyKind(
                "pages",
                async () => {
                    const ids = await this.pageIds();
                    return typeof ids === "string" ? ids : ids.all;
                },
                id => this.deletePage.execute({ id })
            );
            if (typeof pages === "string") {
                return pages;
            }
            counts.pages = pages;
            await report(`Deleted the site's ${pages} page(s), the bin included.`);

            // Components after pages: a component no page names can go without breaking anything.
            const components = await this.emptyKind(
                "components",
                () => this.componentIds(),
                id => this.deleteComponent.execute(id)
            );
            if (typeof components === "string") {
                return components;
            }
            counts.components = components;
            await report(`Deleted the site's ${components} component(s).`);

            const files = await this.emptyKind(
                "files",
                () => this.fileIds(),
                id => this.deleteFile.execute(id)
            );
            if (typeof files === "string") {
                return files;
            }
            counts.files = files;
            await report(`Deleted the site's ${files} file(s) and their stored objects.`);

            // The active theme cannot be deleted while it is active; the tenant is going, so clear it.
            const cleared = await this.activeTheme.clear();
            if (cleared.isFail()) {
                return `Could not clear the site's active theme: ${reason(cleared.error)}`;
            }
            const themes = await this.emptyKind(
                "themes",
                () => this.themeIds(),
                id => this.deleteTheme.execute({ id })
            );
            if (typeof themes === "string") {
                return themes;
            }
            counts.themes = themes;
            await report(`Deleted the site's ${themes} theme(s).`);

            return counts;
        });
    }

    async eraseTenant(tenantId: string): Promise<true | string> {
        const model = await this.getModel.execute(TENANT_MODEL_ID);
        if (model.isFail()) {
            return `Could not read the Tenant Manager model: ${reason(model.error)}`;
        }
        const deleted = await this.deleteEntry.execute(model.value, tenantId, {
            permanently: true
        });
        if (deleted.isFail() && deleted.error.code !== "Cms/Entry/NotFound") {
            return `Could not delete the tenant's Tenant Manager entry: ${reason(deleted.error)}`;
        }
        const entry = await this.getLatest.execute(model.value, { id: tenantId });
        if (entry.isOk()) {
            return "The tenant's Tenant Manager entry is still there after it was deleted.";
        }
        const tenant = await this.getTenantById.execute(tenantId);
        if (tenant.isOk()) {
            return "The tenant's Tenant Manager entry was deleted, but the tenant is still there: the delete handler reports no failure, so it has to be removed by hand.";
        }
        if (tenant.error.type !== "NOT_FOUND") {
            return `Could not check the tenant is gone: ${reason(tenant.error)}`;
        }
        return true;
    }

    /**
     * Delete everything a listing returns, list again, and repeat until it comes back empty. Done means
     * the listing is empty, not that every delete answered ok.
     */
    private async emptyKind(
        kind: string,
        list: () => Promise<string[] | string>,
        remove: (id: string) => Promise<{ isFail(): boolean; error?: unknown }>
    ): Promise<number | string> {
        let deleted = 0;
        let lastError = "";
        for (let round = 0; round < MAX_ROUNDS; round++) {
            const ids = await list();
            if (typeof ids === "string") {
                return ids;
            }
            if (ids.length === 0) {
                return deleted;
            }
            let progressed = false;
            for (const id of ids) {
                const result = await remove(id);
                if (result.isFail()) {
                    lastError = reason((result as { error?: unknown }).error);
                } else {
                    deleted += 1;
                    progressed = true;
                }
            }
            if (!progressed) {
                return `The site's ${kind} could not be deleted: ${ids.length} remain (${lastError || "no reason given"}).`;
            }
        }
        return `The site's ${kind} were still listed after ${deleted} deletions.`;
    }

    /** Every page, its latest revision in any state, and every page in the bin. */
    private async pageIds(): Promise<{ all: string[]; published: number } | string> {
        const all: string[] = [];
        let published = 0;
        for (const deleted of [false, true]) {
            let after: string | null = null;
            do {
                const listed = await this.pageBatch(deleted, after);
                if (typeof listed === "string") {
                    return listed;
                }
                for (const page of listed.pages) {
                    all.push(page.id);
                    if (!deleted && page.status === "published") {
                        published += 1;
                    }
                }
                after = listed.cursor;
            } while (after);
        }
        return { all, published };
    }

    private async componentIds(): Promise<string[] | string> {
        const listed = await this.listComponents.execute();
        if (listed.isFail()) {
            return `Could not list the site's components: ${reason(listed.error)}`;
        }
        return listed.value.items.map(item => item.id);
    }

    private async fileIds(): Promise<string[] | string> {
        const ids: string[] = [];
        let after: string | null = null;
        do {
            const listed = await this.listFiles.execute({ limit: 500, after });
            if (listed.isFail()) {
                return `Could not list the site's files: ${reason(listed.error)}`;
            }
            ids.push(...listed.value.items.map(file => file.id));
            after = listed.value.meta.hasMoreItems ? (listed.value.meta.cursor ?? null) : null;
        } while (after);
        return ids;
    }

    private async themeIds(): Promise<string[] | string> {
        const ids: string[] = [];
        let after: string | null = null;
        do {
            const listed = await this.listThemes.execute({ limit: 100, after });
            if (listed.isFail()) {
                return `Could not list the site's themes: ${reason(listed.error)}`;
            }
            ids.push(...listed.value.themes.map(theme => theme.id));
            after = listed.value.meta.hasMoreItems ? (listed.value.meta.cursor ?? null) : null;
        } while (after);
        return ids;
    }

    /** One page of pages, live or in the bin, and the cursor to the next. */
    private async pageBatch(
        deleted: boolean,
        after: string | null
    ): Promise<{ pages: WbPage[]; cursor: string | null } | string> {
        const params = { where: { latest: true }, sort: [], limit: 100, after };
        const listed = deleted
            ? await this.listDeletedPages.execute(params)
            : await this.listPages.execute(params);
        if (listed.isFail()) {
            return `Could not list the site's pages: ${reason(listed.error)}`;
        }
        return {
            pages: listed.value.pages,
            cursor: listed.value.meta.hasMoreItems ? listed.value.meta.cursor : null
        };
    }
}

export const SiteTenantEraserImplementation = SiteTenantEraser.createImplementation({
    implementation: SiteTenantEraserImpl,
    dependencies: [
        TenantContext,
        GetTenantByIdUseCase,
        GetModelUseCase,
        DeleteEntryUseCase,
        GetLatestRevisionByEntryIdIncludingDeletedUseCase,
        ListPagesUseCase,
        ListDeletedPagesUseCase,
        DeletePageUseCase,
        ListRemoteComponentsUseCase,
        DeleteRemoteComponentUseCase,
        ListFilesUseCase,
        DeleteFileUseCase,
        ListThemesUseCase,
        DeleteThemeUseCase,
        ActiveThemeStore
    ]
});
