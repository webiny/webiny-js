import { makeAutoObservable } from "mobx";
import { decodeCursor, encodeCursor } from "@webiny/utils";
import { IMetaRepository } from "./IMetaRepository";
import { Meta, MetaDTO, MetaMapper } from "~/fta/Domain/Models/Meta";

export class MetaRepository implements IMetaRepository {
    private meta: Meta;

    constructor() {
        this.meta = Meta.createEmpty();
        makeAutoObservable(this);
    }

    async set(meta: MetaDTO) {
        this.meta = Meta.create(meta);
    }

    get() {
        return MetaMapper.toDto(this.meta);
    }

    async decreaseTotalCount(count = 1) {
        return await this.updateMetaOnColumnDeltaChange(-count);
    }

    async increaseTotalCount(count = 1) {
        return await this.updateMetaOnColumnDeltaChange(count);
    }

    private async updateMetaOnColumnDeltaChange(countDelta: number) {
        // Retrieve the current meta
        const current = this.get();

        // Calculate the new totalCount based on the delta change
        const totalCount = current.totalCount + countDelta;

        // Calculate the new cursor position based on the delta change
        const cursorDecoded = decodeCursor(current.cursor);
        const newCursorDecoded = String(Number(cursorDecoded) + countDelta);
        const cursor = encodeCursor(newCursorDecoded);

        // Update the meta with the new totalCount and cursor
        return await this.set({ ...current, totalCount, cursor });
    }
}
