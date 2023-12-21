import { makeAutoObservable } from "mobx";
import { DefaultData } from "@webiny/ui/DataTable";

type Data<T> = Array<DefaultData & T>;

export class DataRepository<T> {
    private data: Data<T> = [];
    private selected: Data<T> = [];

    constructor() {
        makeAutoObservable(this);
    }

    async loadData(data: Data<T>) {
        this.data = data;
    }

    async loadSelected(selected: DefaultData[]) {
        this.selected = this.data.filter(row => selected.find(item => row.id === item.id));
    }

    getData() {
        return this.data;
    }

    getSelected() {
        return this.selected;
    }
}
