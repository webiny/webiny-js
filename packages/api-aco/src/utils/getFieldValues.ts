import pick from "lodash/pick";

import { CmsEntry } from "@webiny/api-headless-cms/types";
import { parseIdentifier } from "@webiny/utils";

export function getFieldValues(entry: CmsEntry, fields: string[], useEntryId?: boolean): any {
    // We return the `id` without version in case of `useEntryId` flag is passed.
    const { id } = parseIdentifier(entry.id);
    return { ...pick(entry, fields), ...entry.values, ...(useEntryId && { id }) };
}
