import { makeAutoObservable } from "mobx";
import type { ColumnsPresenter } from "../Columns/ColumnsPresenter.js";

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
