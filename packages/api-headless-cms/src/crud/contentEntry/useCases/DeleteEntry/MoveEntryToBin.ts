import { NotFoundError } from "@webiny/handler-graphql";
import {
    IDeleteEntry,
    IGetLatestRevisionByEntryId,
    IMoveEntryToBinOperation
} from "~/crud/contentEntry/adstractions";
import { TransformEntryMoveToBin } from "./TransformEntryMoveToBin";
import { CmsModel } from "~/types";

export class MoveEntryToBin implements IDeleteEntry {
    private getEntry: IGetLatestRevisionByEntryId;
    private transformEntry: TransformEntryMoveToBin;
    private moveEntryToBin: IMoveEntryToBinOperation;

    constructor(
        getEntry: IGetLatestRevisionByEntryId,
        transformEntry: TransformEntryMoveToBin,
        moveEntryToBin: IMoveEntryToBinOperation
    ) {
        this.getEntry = getEntry;
        this.transformEntry = transformEntry;
        this.moveEntryToBin = moveEntryToBin;
    }

    async execute(model: CmsModel, id: string) {
        const entryToDelete = await this.getEntry.execute(model, { id });

        if (!entryToDelete) {
            throw new NotFoundError(`Entry "${id}" was not found!`);
        }

        const { entry, storageEntry } = await this.transformEntry.execute(model, entryToDelete);

        await this.moveEntryToBin.execute(model, { entry, storageEntry });
    }
}
