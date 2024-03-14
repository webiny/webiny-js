import { makeAutoObservable } from "mobx";
import { IBinController, IBinRepository } from "~/abstractions";

export class BinController<TListParams> implements IBinController {
    private repository: IBinRepository<TListParams>;

    constructor(repository: IBinRepository<TListParams>) {
        this.repository = repository;
        makeAutoObservable(this);
    }

    async deleteEntry(id: string) {
        return await this.repository.deleteEntry(id);
    }
}
