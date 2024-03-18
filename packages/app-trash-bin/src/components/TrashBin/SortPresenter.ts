import { makeAutoObservable } from "mobx";
import {
    ISortPresenter,
    ISortRepository,
    SortMapper,
    SortPresenterViewModel
} from "@webiny/app-trash-bin-common";

export class SortPresenter implements ISortPresenter {
    private repository: ISortRepository;

    constructor(repository: ISortRepository) {
        this.repository = repository;
        makeAutoObservable(this);
    }

    init() {
        return Promise.resolve();
    }

    get vm(): SortPresenterViewModel {
        return {
            sorting: this.repository.get().map(sort => SortMapper.fromDTOtoColumn(sort))
        };
    }
}
