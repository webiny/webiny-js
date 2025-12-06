import { reaction, makeAutoObservable } from "mobx";
import {
    IDocumentListPresenterInit,
    IDocumentListVm,
    PageListPresenter
} from "@webiny/app-website-builder/presentation/pages/PageList/index.js";
import { SelectabilityRepository } from "~/presentation/page/PageList/SelectabilityRepository.js";

class PageListPresenterWithWorkflows implements PageListPresenter.Interface {
    private repository = new SelectabilityRepository();

    constructor(private decoratee: PageListPresenter.Interface) {
        makeAutoObservable(this);
    }

    get vm(): IDocumentListVm {
        const vm = this.decoratee.vm;

        return {
            ...vm,
            data: vm.data.map(page => {
                return {
                    ...page,
                    $selectable: this.repository.get(page.id)
                };
            })
        };
    }

    init(params: IDocumentListPresenterInit): void {
        // Prefetch selectability rules when records change
        reaction(
            () => this.decoratee.vm.data,
            records => {
                const ids = records.map(r => r.id);
                this.repository.getSelectabilityRules(ids);
            }
        );

        this.decoratee.init(params);
    }

    showFilters(show: boolean): void {
        this.decoratee.showFilters(show);
    }
}

export const PageListPresenterDecorator = PageListPresenter.createDecorator({
    decorator: PageListPresenterWithWorkflows,
    dependencies: []
});
