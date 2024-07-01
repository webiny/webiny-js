import { IRestoreEntryFromBinOperation } from "~/crud/contentEntry/abstractions";

import { RestoreEntryFromBinUseCasesTopics } from "./index";
import { CmsEntryStorageOperationsRestoreFromBinParams, CmsModel } from "~/types";
import WebinyError from "@webiny/error";

export class RestoreEntryFromBinOperationWithEvents implements IRestoreEntryFromBinOperation {
    private topics: RestoreEntryFromBinUseCasesTopics;
    private operation: IRestoreEntryFromBinOperation;

    constructor(
        topics: RestoreEntryFromBinUseCasesTopics,
        operation: IRestoreEntryFromBinOperation
    ) {
        this.topics = topics;
        this.operation = operation;
    }

    async execute(model: CmsModel, params: CmsEntryStorageOperationsRestoreFromBinParams) {
        const entry = params.entry;
        try {
            await this.topics.onEntryBeforeRestoreFromBin.publish({
                entry,
                model
            });

            const result = await this.operation.execute(model, params);

            await this.topics.onEntryAfterRestoreFromBin.publish({
                entry,
                storageEntry: result,
                model
            });

            return result;
        } catch (ex) {
            await this.topics.onEntryRestoreFromBinError.publish({
                entry,
                model,
                error: ex
            });
            throw new WebinyError(
                ex.message || "Could not restore entry from bin.",
                ex.code || "RESTORE_FROM_BIN_ERROR",
                {
                    entry
                }
            );
        }
    }
}
