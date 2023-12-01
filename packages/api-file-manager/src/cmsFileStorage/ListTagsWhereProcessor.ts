import { CmsEntryListWhere } from "@webiny/api-headless-cms/types";
import { FileManagerFilesStorageOperationsListParamsWhere } from "~/types";

type StandardFileKey = keyof FileManagerFilesStorageOperationsListParamsWhere;
type CmsEntryListWhereKey = keyof CmsEntryListWhere;

export class ListTagsWhereProcessor {
    private readonly skipKeys = ["tenant", "locale"];
    private readonly keyMap: Partial<Record<StandardFileKey, CmsEntryListWhereKey>> = {
        tag_startsWith: "tags_startsWith",
        tag_not_startsWith: "tags_not_startsWith"
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
