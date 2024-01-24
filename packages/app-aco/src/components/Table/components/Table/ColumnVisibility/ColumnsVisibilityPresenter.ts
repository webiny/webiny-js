import { makeAutoObservable } from "mobx";
import { ColumnsPresenter } from "../Columns/ColumnsPresenter";

export class ColumnsVisibilityPresenter {
    private columnsPresenter: ColumnsPresenter;

    constructor(columnsPresenter: ColumnsPresenter) {
        this.columnsPresenter = columnsPresenter;
        makeAutoObservable(this);
    }

    get vm() {
        return {
            columnsVisibility: this.getColumnsVisibility()
        };
    }

    private getColumnsVisibility() {
        return this.columnsPresenter.vm.columns.reduce((acc, column) => {
            return { ...acc, [column.name]: column.visible };
        }, {});
    }
}
