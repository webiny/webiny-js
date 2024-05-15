import { set } from "dot-prop-immutable";
import { BindComponentRenderProp } from "@webiny/form";

interface Params {
    value: string[];
    bind: BindComponentRenderProp;
    index: number;
    name: string;
}

export const setValue = (params: Params): void => {
    const { value, bind, index, name } = params;
    const currentValue = [...(bind.value || [])];
    if (index >= 0) {
        bind.onChange(set(currentValue, `${index}.${name}`, value));
    } else {
        bind.onChange(value);
    }
};
