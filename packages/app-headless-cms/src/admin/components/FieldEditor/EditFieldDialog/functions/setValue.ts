import { immutableSet } from "@webiny/utils/dotProp/index.js";
import type { BindComponentRenderProp } from "@webiny/form";

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
        bind.onChange(immutableSet(currentValue, `${index}.${name}`, value));
    } else {
        bind.onChange(value);
    }
};
