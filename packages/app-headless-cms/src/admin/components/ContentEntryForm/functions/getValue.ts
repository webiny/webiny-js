// TODO @ts-refactor figure out correct bind types and remove any

import { CmsEditorField } from "~/types";

interface Params {
    bind: any;
    field: Pick<CmsEditorField, "multipleValues">;
    index: number;
}
export const getValue = (params: Params): string => {
    const { bind, field, index } = params;
    let value = bind.value || null;

    if (field.multipleValues) {
        if (!Array.isArray(value)) {
            value = [];
        }

        if (index >= 0) {
            return value[index] || null;
        }

        return value;
    }

    return value;
};
