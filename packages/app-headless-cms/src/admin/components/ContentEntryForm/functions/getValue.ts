import { CmsModelField } from "~/types";
import { BindComponentRenderProp } from "@webiny/form";

interface GetValueParams {
    bind: BindComponentRenderProp;
    field: Pick<CmsModelField, "multipleValues">;
    index: number;
}
export const getValue = (params: GetValueParams): string => {
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
