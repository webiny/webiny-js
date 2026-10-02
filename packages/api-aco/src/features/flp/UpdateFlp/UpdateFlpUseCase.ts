import { WebinyError } from "@webiny/error";
import { Path } from "~/utils/Path.js";
import { Permissions, ROOT_FOLDER } from "@webiny/shared-aco";
import type { UpdateFlpParams, UpdateFlpUseCase as UseCaseAbstraction } from "./abstractions.js";
import type { Folder, FolderLevelPermission, FolderPermission } from "~/types.js";
import type { AcoFlpCrud } from "~/features/folder/shared/abstractions.js";
import type { ListFoldersUseCase } from "~/features/folder/ListFolders/index.js";
import type { FolderModelProvider } from "~/domain/folder/abstractions.js";
import { EntryId } from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import type { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import type { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";

interface FlpUpdateData {
    parentId: string;
    slug: string;
    path: string;
    permissions: FolderPermission[];
}

export class UpdateFlpUseCase implements UseCaseAbstraction.Interface {
    private isCloseToTimeout?: () => boolean;
    private handleTimeout?: (updated: string[]) => void;

    /*
     * Folders whose whole subtree has been written, carried across task runs as `completed` so a
     * continued run skips them. A folder is added only after all of its descendants are written: one
     * entered but not finished when time ran out has to be walked again, or the rest of its subtree
     * would never be updated.
     *
     * Only the topmost finished folders are kept. When a folder completes, its children leave the
     * set, since skipping the folder already skips them. The set travels in the task input on every
     * continuation, and listing every finished folder would outgrow it on exactly the large trees
     * that need continuing.
     */
    private readonly completed: Set<string> = new Set();
    private readonly flpsToUpdate: Map<string, FlpUpdateData> = new Map();
    private timedOut = false;
    // How many folders this run finished, so a run that finished none can refuse to hand over.
    private completedThisRun = 0;

    constructor(
        private flpCrud: AcoFlpCrud.Interface,
        private listFoldersUseCase: ListFoldersUseCase.Interface,
        private folderModelProvider: FolderModelProvider.Interface,
        private updateEntryUseCase: UpdateEntryUseCase.Interface,
        private identityContext: IdentityContext.Interface
    ) {}

    async execute(params: UpdateFlpParams): Promise<void> {
        this.isCloseToTimeout = params.isCloseToTimeout;
        this.handleTimeout = params.handleTimeout;

        // Fresh per run, so an instance that ever gets reused does not carry the last run's state.
        this.completed.clear();
        this.timedOut = false;
        this.completedThisRun = 0;

        if (params.completed) {
            params.completed.forEach(id => this.completed.add(id));
        }

        try {
            const { folder } = params;

            if (!folder) {
                throw new WebinyError(
                    "Missing `folder`, I can't update the FLP record.",
                    "ERROR_UPDATING_FLP_USE_CASE_FOLDER_NOT_PROVIDED",
                    { folder }
                );
            }

            const flp = await this.getFlp(folder);
            const parentFlp = folder.parentId ? await this.flpCrud.get(folder.parentId) : null;

            // Add the root folder to the update collection
            this.flpsToUpdate.set(folder.id, {
                slug: folder.slug,
                parentId: folder.parentId ?? ROOT_FOLDER,
                path: Path.create(folder.slug, parentFlp?.path),
                permissions: Permissions.create(folder.permissions, parentFlp)
            });

            // Get direct children and process each branch completely
            const directChildren = await this.listDirectChildren(flp);

            for (const child of directChildren) {
                await this.collectBranchForUpdate(child, flp);
                if (this.timedOut) {
                    return;
                }
            }

            // Execute batch update
            await this.executeBatchUpdate();
        } catch (error) {
            // Clear the update collection in case of error
            this.flpsToUpdate.clear();
            this.completed.clear();
            throw WebinyError.from(error, {
                message: "Error while updating FLP",
                code: "ERROR_UPDATING_FLP_USE_CASE"
            });
        }
    }

    private async collectBranchForUpdate(
        flp: FolderLevelPermission,
        parentFlp: FolderLevelPermission
    ): Promise<void> {
        if (this.completed.has(flp.id)) {
            return;
        }

        if (this.isCloseToTimeout?.()) {
            await this.stopForTimeout();
            return;
        }

        // Get the parent's permissions from the update collection if available
        const parentFlpData = this.flpsToUpdate.get(parentFlp.id);
        const currentParentFlp = {
            ...parentFlp,
            ...(parentFlpData && { ...parentFlpData })
        };

        // Add the FLP to the update collection with inherited permissions
        this.flpsToUpdate.set(flp.id, {
            slug: flp.slug,
            parentId: flp.parentId,
            path: Path.create(flp.slug, currentParentFlp.path),
            permissions: Permissions.create(flp.permissions, currentParentFlp)
        });

        // Process all children of this folder before moving to siblings
        const children = await this.listDirectChildren(flp);

        for (const child of children) {
            // Pass the current FLP as the parent for the child
            await this.collectBranchForUpdate(child, flp);
            if (this.timedOut) {
                return;
            }
        }

        // Only now is everything below this folder collected.
        for (const child of children) {
            this.completed.delete(child.id);
        }
        this.completed.add(flp.id);
        this.completedThisRun++;
    }

    /*
     * Writes what has been collected and hands over to a continued run. Every level of the walk
     * checks `timedOut` and stops, rather than carrying on with its remaining children.
     *
     * A run that finished no folder would hand the next run the same input, which would do the same
     * work and hand over again, forever. That fails the task instead.
     */
    private async stopForTimeout(): Promise<void> {
        this.timedOut = true;
        await this.executeBatchUpdate();

        if (this.completedThisRun === 0) {
            throw new WebinyError(
                "The FLP update ran out of time before finishing any folder, so continuing would repeat the same work.",
                "UPDATE_FLP_NO_PROGRESS"
            );
        }

        const completed = Array.from(this.completed);
        this.handleTimeout?.(completed);
    }

    private async executeBatchUpdate(): Promise<void> {
        const folderModel = await this.folderModelProvider.get();
        try {
            const items = Array.from(this.flpsToUpdate.entries()).map(
                ([id, { slug, parentId, path, permissions }]) => {
                    return {
                        id,
                        data: {
                            slug,
                            parentId,
                            path,
                            permissions
                        }
                    };
                }
            );

            await this.flpCrud.batchUpdate(items);

            // Update all folders with the new path
            for (const item of items) {
                const { id, data } = item;
                // Directly update the folder in CMS storage to bypass any folder update event triggers.
                const entryId = EntryId.from(id);
                const updateResult = await this.updateEntryUseCase.execute(
                    folderModel,
                    entryId.toString(),
                    { values: { path: data.path } }
                );
                if (updateResult.isFail()) {
                    throw updateResult.error;
                }
            }
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing batch update of FLPs",
                code: "BATCH_UPDATE_FLP_ERROR",
                data: {
                    items: Array.from(this.flpsToUpdate.keys())
                }
            });
        } finally {
            /*
             * Clear the update collection after the batch update. `completed` is kept: it is what a
             * continued run needs to know.
             */
            this.flpsToUpdate.clear();
        }
    }

    private async listDirectChildren(flp: FolderLevelPermission): Promise<FolderLevelPermission[]> {
        const result = await this.identityContext.withoutAuthorization(() => {
            return this.listFoldersUseCase.execute({
                where: {
                    type: flp.type,
                    parentId: flp.id
                }
            });
        });

        if (result.isFail()) {
            throw result.error;
        }

        return await Promise.all(result.value.folders.map(folder => this.getFlp(folder)));
    }

    private async getFlp({
        id,
        type,
        parentId,
        slug,
        permissions
    }: Folder): Promise<FolderLevelPermission> {
        const flp = await this.flpCrud.get(id);

        if (!flp) {
            const parentFlp = parentId ? await this.flpCrud.get(parentId) : null;

            return await this.flpCrud.create({
                id,
                type,
                slug,
                parentId: parentId ?? ROOT_FOLDER,
                path: Path.create(slug, parentFlp?.path),
                permissions: Permissions.create(permissions, parentFlp)
            });
        }

        return flp;
    }
}
