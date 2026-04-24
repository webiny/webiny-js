import type { CmsModelField } from "~/types.js";
import type { BindComponentRenderProp } from "@webiny/form";

interface setValueParams {
    value: string[];
    bind: BindComponentRenderProp;
    field: Pick<CmsModelField, "list">;
    index: number;
}
export const setValue = (params: setValueParams): void => {
    const { value, bind, field, index } = params;
    let newValue = field.list ? [...(bind.value || [])] : bind.value;

    if (field.list) {
        if (index >= 0) {
            newValue[index] = value;
        } else {
            newValue = value;
        }
    } else {
        newValue = value;
    }

    bind.onChange(newValue);
};
