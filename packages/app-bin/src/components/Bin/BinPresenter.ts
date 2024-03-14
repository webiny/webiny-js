import { makeAutoObservable } from "mobx";
import { IBinEntryMapper, IBinPresenter, IBinRepository } from "~/abstractions";
import { BinEntry, BinEntryMapper } from "~/domain";

export class BinPresenter<TListParams> implements IBinPresenter {
    private repository: IBinRepository<TListParams>;
    private entryMapper: IBinEntryMapper<BinEntry>;

    constructor(repository: IBinRepository<TListParams>) {
        this.repository = repository;
        this.entryMapper = new BinEntryMapper();
        makeAutoObservable(this);
    }

    async load() {
        await this.repository.listEntries();
    }

    get vm() {
        return {
            entries: this.repository.getEntries().map(entry => this.entryMapper.toDTO(entry)),
            loading: this.repository.getLoading()
        };
    }
}
