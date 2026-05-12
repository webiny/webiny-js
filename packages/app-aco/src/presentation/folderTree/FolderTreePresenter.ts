import { makeAutoObservable, reaction, runInAction } from "mobx";
import slugify from "slugify";
import {
    FolderTreePresenter as Abstraction,
    type IFolderTreeNode,
    type IFolderTreeViewModel,
    type IFolderOperationState
} from "./abstractions.js";
import { ROOT_FOLDER } from "~/constants.js";
import { FoldersCache, FoldersContext } from "~/features/folders/abstractions.js";
import { ListFoldersUseCase } from "~/features/folders/listFolders/abstractions.js";
import { ListFoldersByParentIdsUseCase } from "~/features/folders/listFoldersByParentIds/abstractions.js";
import { CreateFolderUseCase } from "~/features/folders/createFolder/abstractions.js";
import { UpdateFolderUseCase } from "~/features/folders/updateFolder/abstractions.js";
import { DeleteFolderUseCase } from "~/features/folders/deleteFolder/abstractions.js";
import { GetFolderAncestorsUseCase } from "~/features/folders/getFolderAncestors/abstractions.js";
import { GetFolderLevelPermissionUseCase } from "~/features/folders/getFolderLevelPermission/abstractions.js";
import { FormModelFactory } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { Folder } from "~/domain/folder/Folder.js";

type FolderChangeCallback = (folderId: string | null) => void;

class FolderTreePresenterImpl implements Abstraction.Interface {
    private currentFolderId: string | null = null;
    private loading = false;
    private _loadingNodeIds: string[] = [];
    private operation: IFolderOperationState = { active: false, mode: null };
    private callbacks: Set<FolderChangeCallback> = new Set();
    private disposed = false;

    constructor(
        private foldersContext: FoldersContext.Interface,
        private foldersCache: FoldersCache.Interface,
        private listFoldersUseCase: ListFoldersUseCase.Interface,
        private listFoldersByParentIdsUseCase: ListFoldersByParentIdsUseCase.Interface,
        private createFolderUseCase: CreateFolderUseCase.Interface,
        private updateFolderUseCase: UpdateFolderUseCase.Interface,
        private deleteFolderUseCase: DeleteFolderUseCase.Interface,
        private getFolderAncestorsUseCase: GetFolderAncestorsUseCase.Interface,
        private getFolderLevelPermissionUseCase: GetFolderLevelPermissionUseCase.Interface,
        private formModelFactory: FormModelFactory.Interface
    ) {
        makeAutoObservable<FolderTreePresenterImpl, "callbacks">(
            this,
            { callbacks: false },
            { autoBind: true }
        );

        reaction(
            () => this.currentFolderId,
            folderId => {
                if (!this.disposed) {
                    this.callbacks.forEach(cb => cb(folderId));
                }
            }
        );

        this.loadFolders();
    }

    get vm(): IFolderTreeViewModel {
        const tree = this.buildTree();
        const currentFolder = this.findNode(this.currentFolderId, tree);
        return {
            tree,
            currentFolderId: this.currentFolderId,
            currentFolder,
            isRootFolder: this.currentFolderId === null,
            currentFolderTitle: currentFolder?.name ?? "All Files",
            childFolders: currentFolder
                ? currentFolder.children
                : tree.filter(n => n.id !== ROOT_FOLDER),
            loading: this.loading,
            loadingNodeIds: this._loadingNodeIds,
            operation: this.operation
        };
    }

    selectFolder(folderId: string | null): void {
        this.currentFolderId = folderId;
        if (folderId) {
            void this.loadChildFolders([folderId]);
        }
    }

    onFolderChange(callback: FolderChangeCallback): () => void {
        this.callbacks.add(callback);
        return () => {
            this.callbacks.delete(callback);
        };
    }

    async loadChildFolders(parentIds: string[]): Promise<void> {
        const fetchableIds = parentIds.filter(id => id !== ROOT_FOLDER && id !== "0");
        if (fetchableIds.length === 0) {
            return;
        }

        runInAction(() => {
            this._loadingNodeIds = fetchableIds;
        });

        try {
            await this.listFoldersByParentIdsUseCase.execute(fetchableIds);
        } finally {
            runInAction(() => {
                this._loadingNodeIds = [];
            });
        }
    }

    async moveFolder(folderId: string, targetParentId: string | null): Promise<void> {
        const folders = this.foldersCache.getItems();
        const folder = folders.find(f => f.id === folderId);
        if (!folder) {
            return;
        }

        await this.updateFolderUseCase.execute({
            id: folderId,
            title: folder.title,
            slug: folder.slug,
            type: this.foldersContext.type,
            parentId: targetParentId,
            permissions: folder.permissions
        });

        await this.loadFolders();
    }

    canManageStructure(folderId: string): boolean {
        return this.getFolderLevelPermissionUseCase.execute(folderId, "canManageStructure");
    }

    getAncestorIds(folderId: string): string[] {
        return this.getFolderAncestorsUseCase.execute(folderId).map(f => f.id);
    }

    createFolder(parentFolderId?: string): void {
        const form = this.formModelFactory.create({
            fields: fields => ({
                title: fields.text().label("Title").required("Title is required"),
                slug: fields
                    .text()
                    .label("Slug")
                    .required("Slug is required")
                    .computedUntilDirty(f => {
                        const title = f.field("title").getValue();
                        return slugify(String(title ?? ""), {
                            replacement: "-",
                            lower: true,
                            remove: /[*#\?<>_\{\}\[\]+~.()'"!:;@]/g,
                            trim: false
                        });
                    }),
                parentId: fields
                    .text()
                    .label("Parent folder")
                    .renderer("folderTree" as any)
            }),
            layout: layout => [layout.row("title"), layout.row("slug"), layout.row("parentId")]
        });

        form.setData({ parentId: parentFolderId ?? null });

        this.operation = {
            active: true,
            mode: "create",
            parentFolderId,
            form
        };
    }

    editFolder(folderId: string): void {
        const folders = this.foldersCache.getItems();
        const folder = folders.find(f => f.id === folderId);
        if (!folder) {
            return;
        }

        const form = this.formModelFactory.create({
            fields: fields => ({
                title: fields.text().label("Name").required("Name is required"),
                slug: fields
                    .text()
                    .label("Slug")
                    .required("Slug is required")
                    .computedUntilDirty(f => {
                        const title = f.field("title").getValue();
                        return slugify(String(title ?? ""), {
                            replacement: "-",
                            lower: true,
                            remove: /[*#\?<>_\{\}\[\]+~.()'"!:;@]/g,
                            trim: false
                        });
                    })
            }),
            layout: layout => [layout.row("title"), layout.row("slug")]
        });

        form.setData({ title: folder.title, slug: folder.slug });

        this.operation = {
            active: true,
            mode: "edit",
            folderId,
            form
        };
    }

    async submitOperation(): Promise<boolean> {
        const { mode, form, parentFolderId, folderId } = this.operation;
        if (!form || !mode) {
            return false;
        }

        const data = await form.submit<{ title: string; slug: string; parentId?: string | null }>();
        if (!data) {
            return false;
        }

        if (mode === "create") {
            await this.createFolderUseCase.execute({
                title: data.title,
                slug: data.slug,
                type: this.foldersContext.type,
                parentId: data.parentId ?? parentFolderId ?? null,
                permissions: []
            });
        } else if (mode === "edit" && folderId) {
            const folders = this.foldersCache.getItems();
            const folder = folders.find(f => f.id === folderId);

            await this.updateFolderUseCase.execute({
                id: folderId,
                title: data.title,
                slug: data.slug,
                type: this.foldersContext.type,
                parentId: folder?.parentId ?? null,
                permissions: folder?.permissions ?? []
            });
        }

        await this.loadFolders();

        runInAction(() => {
            this.operation = { active: false, mode: null };
        });

        return true;
    }

    async deleteFolder(folderId: string): Promise<void> {
        const folders = this.foldersCache.getItems();
        const folder = folders.find(f => f.id === folderId);
        const parentId = folder?.parentId ?? null;

        this.operation = {
            active: true,
            mode: "delete",
            folderId
        };

        await this.deleteFolderUseCase.execute(folderId);
        await this.loadFolders();

        runInAction(() => {
            this.operation = { active: false, mode: null };
            this.currentFolderId = parentId;
        });
    }

    cancelOperation(): void {
        this.operation = { active: false, mode: null };
    }

    private async loadFolders(): Promise<void> {
        runInAction(() => {
            this.loading = true;
        });

        try {
            await this.listFoldersUseCase.execute();
        } finally {
            runInAction(() => {
                this.loading = false;
            });
        }
    }

    private buildTree(): IFolderTreeNode[] {
        const folders = this.foldersCache.getItems();
        return this.buildTreeFromFolders(folders);
    }

    private buildTreeFromFolders(folders: Folder[]): IFolderTreeNode[] {
        const nodeMap = new Map<string, IFolderTreeNode>();

        for (const folder of folders) {
            nodeMap.set(folder.id, {
                id: folder.id,
                name: folder.title,
                slug: folder.slug,
                parentId: folder.parentId,
                children: [],
                hasNonInheritedPermissions: folder.hasNonInheritedPermissions ?? false,
                canManagePermissions: folder.canManagePermissions ?? false,
                canManageStructure: folder.canManageStructure ?? true
            });
        }

        const roots: IFolderTreeNode[] = [];
        for (const folder of folders) {
            const node = nodeMap.get(folder.id)!;
            if (folder.parentId && nodeMap.has(folder.parentId)) {
                nodeMap.get(folder.parentId)!.children.push(node);
            } else {
                roots.push(node);
            }
        }

        return roots;
    }

    private findNode(folderId: string | null, nodes: IFolderTreeNode[]): IFolderTreeNode | null {
        if (folderId === null) {
            return null;
        }

        for (const node of nodes) {
            if (node.id === folderId) {
                return node;
            }
            const found = this.findNode(folderId, node.children);
            if (found) {
                return found;
            }
        }

        return null;
    }
}

export const FolderTreePresenter = Abstraction.createImplementation({
    implementation: FolderTreePresenterImpl,
    dependencies: [
        FoldersContext,
        FoldersCache,
        ListFoldersUseCase,
        ListFoldersByParentIdsUseCase,
        CreateFolderUseCase,
        UpdateFolderUseCase,
        DeleteFolderUseCase,
        GetFolderAncestorsUseCase,
        GetFolderLevelPermissionUseCase,
        FormModelFactory
    ]
});
