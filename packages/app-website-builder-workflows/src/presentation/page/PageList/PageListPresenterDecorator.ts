import {
    PageListPresenter,
    type IPageListPresenter,
    type IPageListViewModel,
    type IPageListInitConfig
} from "@webiny/app-website-builder/presentation/pages/PageList/index.js";
import type { IListPresenter } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { IFolderTreePresenter } from "@webiny/app-aco/presentation/folderTree/abstractions.js";
import type { Page } from "@webiny/app-website-builder/domain/Page/Page.js";

class PageListPresenterWithWorkflows implements IPageListPresenter {
    constructor(private decoratee: IPageListPresenter) {}

    get vm(): IPageListViewModel {
        return this.decoratee.vm;
    }

    // TODO: intercept list.vm.rows to set $selectable=false on TableRow for pages with active workflow state.
    // Currently $selectable is set in TableRowMapper.fromPage(), which always returns true.
    get list(): IListPresenter<Page> {
        return this.decoratee.list;
    }

    get folders(): IFolderTreePresenter {
        return this.decoratee.folders;
    }

    init(config?: IPageListInitConfig): void {
        this.decoratee.init(config);
    }

    dispose(): void {
        this.decoratee.dispose();
    }

    deletePage(id: string): Promise<boolean> {
        return this.decoratee.deletePage(id);
    }

    publishPage(id: string): Promise<boolean> {
        return this.decoratee.publishPage(id);
    }

    unpublishPage(id: string): Promise<boolean> {
        return this.decoratee.unpublishPage(id);
    }

    movePage(id: string, folderId: string): Promise<boolean> {
        return this.decoratee.movePage(id, folderId);
    }

    duplicatePage(id: string): Promise<boolean> {
        return this.decoratee.duplicatePage(id);
    }
}

export const PageListPresenterDecorator = PageListPresenter.createDecorator({
    decorator: PageListPresenterWithWorkflows,
    dependencies: []
});
