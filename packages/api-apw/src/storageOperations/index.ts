import { HeadlessCms } from "@webiny/api-headless-cms/types";
import { ApwStorageOperations } from "~/types";

interface CreateApwStorageOperationsParams {
    cms: HeadlessCms;
}

export const createStorageOperations = ({
    cms
}: CreateApwStorageOperationsParams): ApwStorageOperations => {
    return {
        getModel: cms.getModel,
        getEntryById: cms.getEntryById,
        listLatestEntries: cms.listLatestEntries,
        createEntry: cms.createEntry,
        updateEntry: cms.updateEntry,
        deleteEntry: cms.deleteEntry
    };
};
