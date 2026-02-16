import type { CmsModelField } from "~/types.js";
import type { BindComponentRenderProp } from "@webiny/form";

interface GetValueParams {
    bind: BindComponentRenderProp;
    field: Pick<CmsModelField, "list">;
    index: number;
}
export const getValue = (params: GetValueParams): string => {
    const { bind, field, index } = params;
    let value = bind.value || null;

    if (field.list) {
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
