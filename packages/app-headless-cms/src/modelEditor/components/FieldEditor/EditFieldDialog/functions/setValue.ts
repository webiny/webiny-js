import set from "lodash/set";
import { BindComponentRenderProp } from "@webiny/form";

interface Params {
    value: string[];
    bind: BindComponentRenderProp;
    index: number;
    name: string;
}
const setValue = (params: Params): void => {
    const { value, bind, index, name } = params;
    let newValue = [...(bind.value || [])];
    if (index >= 0) {
        set(newValue, `${index}.${name}`, value);
    } else {
        newValue = value;
    }

    bind.onChange(newValue);
};

export default setValue;
