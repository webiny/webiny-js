import { NotAuthorizedError } from "@webiny/api-security";
import { PbAcoContext } from "~/types";
import { Page } from "@webiny/api-page-builder/types";

interface PageBuilderCrudDecoratorsParams {
    context: PbAcoContext;
}

export class PageBuilderCrudDecorators {
    private readonly context: PbAcoContext;

    // TODO: Not smart to pass the whole `context`. We probably want to refactor this.
    constructor({ context }: PageBuilderCrudDecoratorsParams) {
        this.context = context;
    }

    decorate() {
        const context = this.context;
        const folderLevelPermissions = context.aco.folderLevelPermissions;

        // List pages stays the same. Because of technical reasons, we cannot filter pages by folder.
        // We will be able to do this once PB starts using HCMS as the storage layer.
        const originalPbListLatestPages = context.pageBuilder.listLatestPages.bind(
            context.pageBuilder
        );
        context.pageBuilder.listLatestPages = async (...params) => {
            return originalPbListLatestPages(...params);
        };

        const originalPbListPublishedPages = context.pageBuilder.listPublishedPages.bind(
            context.pageBuilder
        );
        context.pageBuilder.listPublishedPages = async (...params) => {
            return originalPbListPublishedPages(...params);
        };

        const originalPbGetPage = context.pageBuilder.getPage.bind(context.pageBuilder);

        // @ts-ignore TODO: Couldn't figure out how to resolve the issue.
        context.pageBuilder.getPage = async (pageId, options) => {
            const page = await originalPbGetPage(pageId, options);
            const pageSearchRecord = await context.pageBuilderAco.app.search.get(page.pid);
            if (pageSearchRecord && pageSearchRecord.location.folderId !== "root") {
                const folder = await context.aco.folder.get(pageSearchRecord.location.folderId);
                const canAccessPageFolder = await folderLevelPermissions.canAccessFolderContent({
                    folder,
                    rwd: "r"
                });

                if (!canAccessPageFolder) {
                    throw new NotAuthorizedError();
                }
            }

            return page as Page;
        };

        const originalPbCreatePage = context.pageBuilder.createPage.bind(context.pageBuilder);
        context.pageBuilder.createPage = async (category, meta) => {
            if (meta?.location?.folderId && meta.location.folderId !== "root") {
                const folder = await context.aco.folder.get(meta.location.folderId);
                const canAccessPageFolder = await folderLevelPermissions.canAccessFolderContent({
                    folder,
                    rwd: "w"
                });

                if (!canAccessPageFolder) {
                    throw new NotAuthorizedError();
                }
            }

            return originalPbCreatePage(category);
        };

        const originalPbUpdatePage = context.pageBuilder.updatePage.bind(context.pageBuilder);
        context.pageBuilder.updatePage = async (pageId, data) => {
            const page = await originalPbGetPage(pageId);
            const pageSearchRecord = await context.pageBuilderAco.app.search.get(page.pid);
            if (pageSearchRecord && pageSearchRecord.location.folderId !== "root") {
                const folder = await context.aco.folder.get(pageSearchRecord.location.folderId);
                const canAccessPageFolder = await folderLevelPermissions.canAccessFolderContent({
                    folder,
                    rwd: "w"
                });

                if (!canAccessPageFolder) {
                    throw new NotAuthorizedError();
                }
            }

            return originalPbUpdatePage(pageId, data);
        };

        const originalPbDeletePage = context.pageBuilder.deletePage.bind(context.pageBuilder);
        context.pageBuilder.deletePage = async pageId => {
            const page = await originalPbGetPage(pageId);

            const pageSearchRecord = await context.pageBuilderAco.app.search.get(page.pid);
            if (pageSearchRecord && pageSearchRecord.location.folderId !== "root") {
                const folder = await context.aco.folder.get(pageSearchRecord.location.folderId);

                const canAccessPageFolder = await folderLevelPermissions.canAccessFolderContent({
                    folder,
                    rwd: "d"
                });

                if (!canAccessPageFolder) {
                    throw new NotAuthorizedError();
                }
            }

            return originalPbDeletePage(pageId);
        };
    }
}
