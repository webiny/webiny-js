import { makeAutoObservable, reaction, runInAction } from "mobx";
import slugify from "slugify";
import {
    FolderTreePresenter as Abstraction,
    type IFolderTreeNode,
    type IFolderTreeViewModel,
    type IFolderOperationState
} from "./abstractions.js";
import { FoldersCache, FoldersContext } from "~/features/folders/abstractions.js";
import { ListFoldersUseCase } from "~/features/folders/listFolders/abstractions.js";
import { CreateFolderUseCase } from "~/features/folders/createFolder/abstractions.js";
import { UpdateFolderUseCase } from "~/features/folders/updateFolder/abstractions.js";
import { DeleteFolderUseCase } from "~/features/folders/deleteFolder/abstractions.js";
import { FormModelFactory } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { Folder } from "~/domain/folder/Folder.js";

type FolderChangeCallback = (folderId: string | null) => void;

class FolderTreePresenterImpl implements Abstraction.Interface {
    private currentFolderId: string | null = null;
    private loading = false;
    private operation: IFolderOperationState = { active: false, mode: null };
    private callbacks: Set<FolderChangeCallback> = new Set();
    private disposed = false;

    constructor(
        private foldersContext: FoldersContext.Interface,
        private foldersCache: FoldersCache.Interface,
        private listFoldersUseCase: ListFoldersUseCase.Interface,
        private createFolderUseCase: CreateFolderUseCase.Interface,
        private updateFolderUseCase: UpdateFolderUseCase.Interface,
        private deleteFolderUseCase: DeleteFolderUseCase.Interface,
        private formModelFactory: FormModelFactory.Interface
    ) {
        makeAutoObservable<FolderTreePresenterImpl, "callbacks">(
            this,
            { callbacks: false },
            { autoBind: true }
        );

        // Fire callbacks when currentFolderId changes.
        reaction(
            () => this.currentFolderId,
            folderId => {
                if (!this.disposed) {
                    this.callbacks.forEach(cb => cb(folderId));
                }
            }
        );

        // Load folders on construction.
        this.loadFolders();
    }

    get vm(): IFolderTreeViewModel {
        return {
            tree: this.buildTree(),
            currentFolderId: this.currentFolderId,
            currentFolder: this.findNode(this.currentFolderId, this.buildTree()),
            loading: this.loading,
            operation: this.operation
        };
    }

    selectFolder(folderId: string | null): void {
        this.currentFolderId = folderId;
    }

    onFolderChange(callback: FolderChangeCallback): () => void {
        this.callbacks.add(callback);
        return () => {
            this.callbacks.delete(callback);
        };
    }

    createFolder(parentFolderId?: string): void {
        const form = this.formModelFactory.create({
            fields: fields => ({
                title: fields.text().label("Name").required("Name is required"),
                slug: fields.text().label("Slug").required("Slug is required")
            }),
            layout: layout => [layout.row("title"), layout.row("slug")]
        });

        // Auto-generate slug from title.
        form.field("title").addAfterChange((_prev, next) => {
            const currentSlug = form.field("slug").getValue<string>();
            if (!currentSlug) {
                form.field("slug").setValue(
                    slugify(String(next ?? ""), {
                        replacement: "-",
                        lower: true,
                        remove: /[*#\?<>_\{\}\[\]+~.()'"!:;@]/g,
                        trim: false
                    })
                );
            }
        });

        // Wire onSubmit to CreateFolderUseCase.
        const originalSubmit = form.submit.bind(form);
        form.submit = async <T = Record<string, unknown>>(): Promise<T | false> => {
            const data = await originalSubmit<T>();
            if (data === false) {
                return false;
            }

            await this.createFolderUseCase.execute({
                title: (data as Record<string, unknown>).title as string,
                slug: (data as Record<string, unknown>).slug as string,
                type: this.foldersContext.type,
                parentId: parentFolderId ?? null,
                permissions: []
            });

            // Refresh the folder list.
            await this.loadFolders();

            runInAction(() => {
                this.operation = { active: false, mode: null };
            });

            return data;
        };

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
                slug: fields.text().label("Slug").required("Slug is required")
            }),
            layout: layout => [layout.row("title"), layout.row("slug")]
        });

        form.setData({ title: folder.title, slug: folder.slug });

        // Wire onSubmit to UpdateFolderUseCase.
        const originalSubmit = form.submit.bind(form);
        form.submit = async <T = Record<string, unknown>>(): Promise<T | false> => {
            const data = await originalSubmit<T>();
            if (data === false) {
                return false;
            }

            await this.updateFolderUseCase.execute({
                id: folderId,
                title: (data as Record<string, unknown>).title as string,
                slug: (data as Record<string, unknown>).slug as string,
                type: this.foldersContext.type,
                parentId: folder.parentId,
                permissions: folder.permissions
            });

            // Refresh the folder list.
            await this.loadFolders();

            runInAction(() => {
                this.operation = { active: false, mode: null };
            });

            return data;
        };

        this.operation = {
            active: true,
            mode: "edit",
            folderId,
            form
        };
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

        // Refresh the folder list.
        await this.loadFolders();

        runInAction(() => {
            this.operation = { active: false, mode: null };
            // Navigate to parent folder after deletion.
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

        // Create nodes.
        for (const folder of folders) {
            nodeMap.set(folder.id, {
                id: folder.id,
                name: folder.title,
                slug: folder.slug,
                parentId: folder.parentId,
                children: []
            });
        }

        // Build tree.
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
        CreateFolderUseCase,
        UpdateFolderUseCase,
        DeleteFolderUseCase,
        FormModelFactory
    ]
});
