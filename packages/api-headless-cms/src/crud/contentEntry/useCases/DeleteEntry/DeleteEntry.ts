import { NotFoundError } from "@webiny/handler-graphql";
import { parseIdentifier } from "@webiny/utils";
import {
    IDeleteEntry,
    IDeleteEntryOperation,
    IGetLatestRevisionByEntryId
} from "../../abstractions";
import { CmsDeleteEntryOptions, CmsEntry, CmsModel } from "~/types";
import { TransformEntryDelete } from "./TransformEntryDelete";

export class DeleteEntry implements IDeleteEntry {
    private getEntry: IGetLatestRevisionByEntryId;
    private transformEntry: TransformEntryDelete;
    private deleteEntry: IDeleteEntryOperation;

    constructor(
        getEntry: IGetLatestRevisionByEntryId,
        transformEntry: TransformEntryDelete,
        deleteEntry: IDeleteEntryOperation
    ) {
        this.getEntry = getEntry;
        this.transformEntry = transformEntry;
        this.deleteEntry = deleteEntry;
    }

    async execute(model: CmsModel, id: string, options: CmsDeleteEntryOptions) {
        const { force } = options;

        const entryToDelete = await this.getEntry.execute(model, { id });

        /**
         * In the case we are forcing the deletion, we do not need the storageEntry to exist as it might be an error when loading single database record.
         *
         * This happens, sometimes, in the Elasticsearch system as the entry might get deleted from the DynamoDB but not from the Elasticsearch.
         * This is due to high load on the Elasticsearch at the time of the deletion.
         */
        if (!entryToDelete && force) {
            const { id: entryId } = parseIdentifier(id);
            const entry = {
                id,
                entryId
            } as CmsEntry;
            return await this.deleteEntry.execute(model, { entry });
        }

        /**
         * If there is no entry, and we do not force the deletion, just throw an error.
         */
        if (!entryToDelete) {
            throw new NotFoundError(`Entry "${id}" was not found!`);
        }

        const { entry } = await this.transformEntry.execute(model, entryToDelete);

        await this.deleteEntry.execute(model, { entry });
    }
}
