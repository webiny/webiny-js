import pick from "lodash/pick";
import { CmsEntry } from "@webiny/api-headless-cms/types";
import { SearchRecord } from "~/record/record.types";
import { Folder } from "~/folder/folder.types";

export function getRecordFieldValues(entry: CmsEntry, fields: string[]) {
    return {
        ...pick(entry, fields),
        ...entry.values
    } as SearchRecord<any>;
}

export function getFolderFieldValues(entry: CmsEntry, fields: string[]) {
    return { ...pick(entry, fields), ...entry.values } as Folder;
}
