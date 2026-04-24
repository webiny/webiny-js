import type { CmsModelField } from "@webiny/api-headless-cms/types/index.js";
import type { CmsEntryOpenSearchValueSearchRegistry } from "~/features/CmsEntryOpenSearchValueSearch/index.js";

interface Params {
    valueSearchRegistry: CmsEntryOpenSearchValueSearchRegistry.Interface;
    field: CmsModelField;
    value: any;
}

export const transformValueForSearch = (params: Params): any => {
    const { field, valueSearchRegistry, value } = params;
    const search = valueSearchRegistry.get(field.type);
    if (!search) {
        return value;
    }
    return search.transform({ field, value });
};
