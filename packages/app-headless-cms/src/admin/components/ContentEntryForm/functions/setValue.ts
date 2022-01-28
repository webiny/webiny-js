// TODO @ts-refactor figure out correct bind types and remove any
import { CmsEditorField } from "~/types";

interface Params {
    value: string[];
    bind: any;
    field: Pick<CmsEditorField, "multipleValues">;
    index: number;
}
export const setValue = (params: Params): void => {
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
