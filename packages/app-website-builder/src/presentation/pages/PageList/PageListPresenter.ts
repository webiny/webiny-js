import { computed, makeAutoObservable, reaction } from "mobx";
import type { IReactionDisposer } from "mobx";
import { ListPresenter } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import { FolderTreePresenter } from "@webiny/app-aco/presentation/folderTree/abstractions.js";
import { sortFolders } from "@webiny/app-aco";
import { GetDescendantFoldersUseCase } from "@webiny/app-aco/features/folders/getDescendantFolders/abstractions.js";
import { Confirmation } from "@webiny/app-admin/features/confirmation/abstractions.js";
import type { Page } from "~/domain/Page/Page.js";
import { ListPagesUseCase } from "~/features/pages/listPages/abstractions.js";
import { DeletePageUseCase } from "~/features/pages/deletePage/abstractions.js";
import { PublishPageUseCase } from "~/features/pages/publishPage/abstractions.js";
import { UnpublishPageUseCase } from "~/features/pages/unpublishPage/abstractions.js";
import { MovePageUseCase } from "~/features/pages/movePage/abstractions.js";
import { DuplicatePageUseCase } from "~/features/pages/duplicatePage/abstractions.js";
import { PageListCache } from "~/features/pages/shared/abstractions.js";
import { PageListPresenter as Abstraction, type IPageListViewModel } from "./abstractions.js";
import { PageListDataSource } from "./PageListDataSource.js";

export const TRASH_PAGE_DIALOG = "trash-page";

class PageListPresenterImpl implements Abstraction.Interface {
    private _disposeReaction: IReactionDisposer | null = null;

    constructor(
        private _listPresenter: ListPresenter.Interface<Page>,
        private _foldersPresenter: FolderTreePresenter.Interface,
        private confirmation: Confirmation.Interface,
        private listPagesUseCase: ListPagesUseCase.Interface,
        private deletePageUseCase: DeletePageUseCase.Interface,
        private publishPageUseCase: PublishPageUseCase.Interface,
        private unpublishPageUseCase: UnpublishPageUseCase.Interface,
        private movePageUseCase: MovePageUseCase.Interface,
        private duplicatePageUseCase: DuplicatePageUseCase.Interface,
        private pageListCache: PageListCache.Interface,
        private getDescendantFoldersUseCase: GetDescendantFoldersUseCase.Interface
    ) {
        makeAutoObservable<
            PageListPresenterImpl,
            | "_disposeReaction"
            | "confirmation"
            | "listPagesUseCase"
            | "deletePageUseCase"
            | "publishPageUseCase"
            | "unpublishPageUseCase"
            | "movePageUseCase"
            | "duplicatePageUseCase"
            | "pageListCache"
            | "getDescendantFoldersUseCase"
        >(this, {
            _disposeReaction: false,
            confirmation: false,
            listPagesUseCase: false,
            deletePageUseCase: false,
            publishPageUseCase: false,
            unpublishPageUseCase: false,
            movePageUseCase: false,
            duplicatePageUseCase: false,
            pageListCache: false,
            getDescendantFoldersUseCase: false,
            vm: computed
        });
    }

    get vm(): IPageListViewModel {
        return {
            showFolders: this.shouldShowFolders(),
            childFolders: this.getSortedChildFolders()
        };
    }

    private getSortedChildFolders() {
        if (!this.shouldShowFolders()) {
            return [];
        }
        return sortFolders(
            this._foldersPresenter.vm.childFolders ?? [],
            this._listPresenter.vm.appliedQuery?.sort
        );
    }

    private shouldShowFolders(): boolean {
        const { appliedQuery } = this._listPresenter.vm;
        if (!appliedQuery) {
            return true;
        }
        if (appliedQuery.search) {
            return false;
        }
        const hasFilters = Object.keys(this._listPresenter.vm.filters).some(k => k !== "folderId");
        return !hasFilters;
    }

    get list(): ListPresenter.Interface<Page> {
        return this._listPresenter;
    }

    get folders(): FolderTreePresenter.Interface {
        return this._foldersPresenter;
    }

    init(config: Abstraction.InitConfig = {}): void {
        const initialFolderId = config.initialFolderId ?? "root";

        const dataSource = new PageListDataSource(
            this.listPagesUseCase,
            this.pageListCache,
            this.getDescendantFoldersUseCase
        );

        this._listPresenter.init({
            dataSource,
            initialSort: { field: "savedOn", direction: "DESC" },
            initialFilters: { folderId: initialFolderId },
            initialSearch: config.initialSearch,
            limit: 50,
            itemLabel: { singular: "page", plural: "pages" }
        });

        if (initialFolderId !== "root") {
            this._foldersPresenter.selectFolder(initialFolderId);
        }

        this._disposeReaction = reaction(
            () => this._foldersPresenter.vm.currentFolderId,
            folderId => {
                const effectiveFolderId = folderId ?? "root";
                this._listPresenter.actions.filter.set("folderId", effectiveFolderId);
            }
        );
    }

    async deletePage(id: string): Promise<boolean> {
        const result = await this.confirmation.confirm(TRASH_PAGE_DIALOG, { pageId: id }, () =>
            this.deletePageUseCase.execute({ id, permanently: false })
        );
        return result !== false;
    }

    async publishPage(id: string): Promise<boolean> {
        await this.publishPageUseCase.execute({ id });
        return true;
    }

    async unpublishPage(id: string): Promise<boolean> {
        await this.unpublishPageUseCase.execute({ id });
        return true;
    }

    async movePage(id: string, folderId: string): Promise<boolean> {
        await this.movePageUseCase.execute({ id, folderId });
        return true;
    }

    async duplicatePage(id: string): Promise<boolean> {
        await this.duplicatePageUseCase.execute({ id });
        return true;
    }

    dispose(): void {
        if (this._disposeReaction) {
            this._disposeReaction();
            this._disposeReaction = null;
        }
    }
}

export const PageListPresenter = Abstraction.createImplementation({
    implementation: PageListPresenterImpl,
    dependencies: [
        ListPresenter,
        FolderTreePresenter,
        Confirmation,
        ListPagesUseCase,
        DeletePageUseCase,
        PublishPageUseCase,
        UnpublishPageUseCase,
        MovePageUseCase,
        DuplicatePageUseCase,
        PageListCache,
        GetDescendantFoldersUseCase
    ]
});
