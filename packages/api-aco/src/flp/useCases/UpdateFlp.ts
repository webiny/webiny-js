import { WebinyError } from "@webiny/error";
import { Path } from "~/utils/Path.js";
import { Permissions, ROOT_FOLDER } from "@webiny/shared-aco";
import type { AcoContext, Folder, FolderLevelPermission, FolderPermission } from "~/types.js";
import { FOLDER_MODEL_ID } from "~/folder/folder.model.js";

interface UpdateFlpParams {
    context: AcoContext;
    queued?: string[];
    isCloseToTimeout?: () => boolean;
    handleTimeout?: (queued: string[]) => void;
}

interface FlpUpdateData {
    parentId: string;
    slug: string;
    path: string;
    permissions: FolderPermission[];
}

export class UpdateFlp {
    private context: AcoContext;
    private readonly isCloseToTimeout?: () => boolean;
    private readonly handleTimeout?: (updated: string[]) => void;

    private readonly queued: Set<string> = new Set();
    private readonly flpsToUpdate: Map<string, FlpUpdateData> = new Map();

    constructor(params: UpdateFlpParams) {
        this.context = params.context;
        this.queued = new Set(params.queued);
        this.isCloseToTimeout = params.isCloseToTimeout;
        this.handleTimeout = params.handleTimeout;
    }

    async execute(folder: Folder) {
        try {
            if (!folder) {
                throw new WebinyError(
                    "Missing `folder`, I can't update the FLP record.",
                    "ERROR_UPDATING_FLP_USE_CASE_FOLDER_NOT_PROVIDED",
                    { folder }
                );
            }

            const flp = await this.getFlp(folder);
            const parentFlp = folder.parentId
                ? await this.context.aco.flp.get(folder.parentId)
                : null;

            // Add the root folder to the update collection
            this.flpsToUpdate.set(folder.id, {
                slug: folder.slug,
                parentId: folder.parentId ?? ROOT_FOLDER,
                path: Path.create(folder.slug, parentFlp?.path),
                permissions: Permissions.create(folder.permissions, parentFlp)
            });

            // Let's set the FLP as in queue
            this.setQueued(flp.id);

            // Get direct children and process each branch completely
            const directChildren = await this.listDirectChildren(flp);

            for (const child of directChildren) {
                if (this.isCloseToTimeout?.()) {
                    await this.executeBatchUpdate();
                    this.handleTimeout?.(this.getQueuedList());
                    return;
                }
                await this.collectBranchForUpdate(child, flp);
            }

            // Execute batch update
            await this.executeBatchUpdate();
        } catch (error) {
            // Clear the update collection in case of error
            this.flpsToUpdate.clear();
            this.queued.clear();
            throw WebinyError.from(error, {
                message: "Error while updating FLP",
                code: "ERROR_UPDATING_FLP_USE_CASE"
            });
        }
    }

    private async collectBranchForUpdate(
        flp: FolderLevelPermission,
        parentFlp: FolderLevelPermission
    ) {
        if (this.isQueued(flp.id)) {
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

        // Add the FLP to the queue list so we don't fetch it again
        this.setQueued(flp.id);

        // Process all children of this folder before moving to siblings
        const children = await this.listDirectChildren(flp);

        for (const child of children) {
            if (this.isCloseToTimeout?.()) {
                await this.executeBatchUpdate();
                this.handleTimeout?.(this.getQueuedList());
                return;
            }
            // Pass the current FLP as the parent for the child
            await this.collectBranchForUpdate(child, flp);
        }
    }

    private async executeBatchUpdate() {
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

            await this.context.aco.flp.batchUpdate(items);

            // Update all folders with the new path
            const folderModel = await this.getFolderModel();
            for (const item of items) {
                const { id, data } = item;
                // Directly update the folder in CMS storage to bypass any folder update event triggers.
                await this.context.cms.updateEntry(folderModel, id, { path: data.path });
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
            // Clear the update collection after the batch update
            this.flpsToUpdate.clear();

            //Let's remove all the updated FLPs ids from the queue cache
            this.clearQueuedList();
        }
    }

    private getQueuedList() {
        return Array.from(this.queued);
    }

    private setQueued(id: string) {
        this.queued.add(id);
    }

    private isQueued(id: string) {
        return this.queued.has(id);
    }

    private clearQueuedList() {
        return this.queued.clear();
    }

    private async listDirectChildren(flp: FolderLevelPermission): Promise<FolderLevelPermission[]> {
        const [folders] = await this.context.security.withoutAuthorization(() => {
            return this.context.aco.folder.listAll({
                where: {
                    type: flp.type,
                    parentId: flp.id
                }
            });
        });

        return await Promise.all(folders.map(folder => this.getFlp(folder)));
    }

    private async getFlp({ id, type, parentId, slug, permissions }: Folder) {
        const flp = await this.context.aco.flp.get(id);

        if (!flp) {
            const parentFlp = parentId ? await this.context.aco.flp.get(parentId) : null;

            return await this.context.aco.flp.create({
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

    private async getFolderModel() {
        return await this.context.cms.getModel(FOLDER_MODEL_ID);
    }
}
