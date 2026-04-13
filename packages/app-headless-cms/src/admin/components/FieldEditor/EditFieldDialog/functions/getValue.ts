import { immutableGet } from "@webiny/utils/dotProp/index.js";
import type { BindComponentRenderProp } from "@webiny/form";

interface Params {
    bind: BindComponentRenderProp;
    index: number;
    name: string;
}

export const getValue = (params: Params): string[] | undefined => {
    const { bind, index, name } = params;
    const value = bind.value || [];

    if (index >= 0) {
        return immutableGet(value, `${index}.${name}`);
    }

    return value;
};
