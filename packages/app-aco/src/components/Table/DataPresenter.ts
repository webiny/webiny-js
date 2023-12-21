import { makeAutoObservable } from "mobx";
import { DataRepository } from "~/components/Table/domain";
import { DefaultData } from "@webiny/ui/DataTable";

type Data<T> = Array<DefaultData & T>;

export class DataPresenter<T> {
    private repository: DataRepository<T>;

    constructor(repository: DataRepository<T>) {
        this.repository = repository;
        makeAutoObservable(this);
    }

    get vm() {
        return {
            data: this.repository.getData(),
            selected: this.repository.getSelected()
        };
    }

    async loadData(data: Data<T>) {
        await this.repository.loadData(data);
    }

    async loadSelected(selected: DefaultData[]) {
        await this.repository.loadSelected(selected);
    }
}
