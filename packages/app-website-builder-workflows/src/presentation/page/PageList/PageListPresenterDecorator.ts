import { makeAutoObservable } from "mobx";
import {
    IDocumentListPresenterInit,
    IDocumentListVm,
    PageListPresenter
} from "@webiny/app-website-builder/presentation/pages/PageList/index.js";
import type { PageDto } from "@webiny/app-website-builder/domain/Page/index.js";

class PageListPresenterWithWorkflows implements PageListPresenter.Interface {
    private readonly decoratee;

    public constructor(decoratee: PageListPresenter.Interface) {
        this.decoratee = decoratee;
        makeAutoObservable(this);
    }

    public get vm(): IDocumentListVm {
        const vm = this.decoratee.vm;
        return {
            ...vm,
            data: vm.data.map(page => {
                return this.decoratePage(page);
            })
        };
    }

    public init(params: IDocumentListPresenterInit): void {
        this.decoratee.init(params);
    }

    public showFilters(show: boolean): void {
        this.decoratee.showFilters(show);
    }

    private decoratePage(page: PageDto): PageDto {
        return {
            ...page,
            system: {
                ...page.system,
                workflow: page.system?.workflow || null
            },
            $selectable: !page.system?.workflow?.state
        };
    }
}

export const PageListPresenterDecorator = PageListPresenter.createDecorator({
    decorator: PageListPresenterWithWorkflows,
    dependencies: []
});
