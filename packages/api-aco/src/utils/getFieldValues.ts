import pick from "lodash/pick";

import { CmsEntry } from "@webiny/api-headless-cms/types";

export function getFieldValues(entry: CmsEntry, fields: string[]): any {
    return { ...pick(entry, fields), ...entry.values };
}
