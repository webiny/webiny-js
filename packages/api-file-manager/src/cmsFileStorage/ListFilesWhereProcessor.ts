import { CmsEntryListWhere } from "@webiny/api-headless-cms/types";
import { FileManagerFilesStorageOperationsListParamsWhere } from "~/types";

type StandardFileKey = keyof FileManagerFilesStorageOperationsListParamsWhere;
type CmsEntryListWhereKey = keyof CmsEntryListWhere;

export class ListFilesWhereProcessor {
    private readonly skipKeys = ["tenant", "locale"];
    private readonly keyMap: Partial<Record<StandardFileKey, CmsEntryListWhereKey>> = {
        id: "entryId",
        id_in: "entryId_in"
    };

    process(input: FileManagerFilesStorageOperationsListParamsWhere): CmsEntryListWhere {
        const where: CmsEntryListWhere = { meta: { private_not: true } };

        Object.keys(input)
            .filter(key => !this.skipKeys.includes(key))
            .forEach(key => {
                const remappedKey = this.keyMap[key];
                const value = input[key];

                if (remappedKey && value !== undefined) {
                    where[remappedKey] = value;
                } else if (value !== undefined) {
                    where[key] = value;
                }
            });

        return where;
    }
}
