import { CmsModelField } from "~/types";
import { BindComponentRenderProp } from "@webiny/form";

interface setValueParams {
    value: string[];
    bind: BindComponentRenderProp;
    field: Pick<CmsModelField, "multipleValues">;
    index: number;
}
export const setValue = (params: setValueParams): void => {
    const { value, bind, field, index } = params;
    let newValue = field.multipleValues ? [...(bind.value || [])] : bind.value;

    if (field.multipleValues) {
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
