import { makeAutoObservable } from "mobx";
import { IMetaRepository } from "~/abstractions/IMetaRepository";
import { Meta, MetaDTO } from "~/domain/Meta";
import { MetaMapper } from "~/domain/MetaMapper";

export class MetaRepository implements IMetaRepository {
    private meta: Meta;

    constructor() {
        this.meta = Meta.createEmpty();
        makeAutoObservable(this);
    }

    async init() {
        return Promise.resolve();
    }

    async set(meta: MetaDTO) {
        this.meta = Meta.create(meta);
    }

    get() {
        return MetaMapper.toDto(this.meta);
    }
}
