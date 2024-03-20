import { makeAutoObservable } from "mobx";
import { IMetaRepository } from "./IMetaRepository";
import { Meta, MetaDTO } from "./Meta";
import { MetaMapper } from "./MetaMapper";

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
