import { CmsEntryElasticsearchQueryBuilderValueSearchPlugin } from "~/plugins";
import { ModelField } from "./types";

interface Params {
    field: ModelField;
    key: string;
    searchPlugin?: CmsEntryElasticsearchQueryBuilderValueSearchPlugin;
}
export const createFieldPath = (params: Params): string => {
    const { field, searchPlugin, key } = params;
    let path: string | undefined | null = undefined;
    if (typeof searchPlugin?.createPath === "function") {
        path = searchPlugin.createPath({
            field: field.field,
            value: null,
            key
        });
    } else if (typeof field.path === "function") {
        path = field.path(field.field.storageId);
    }
    if (!path) {
        /**
         * We know that modelFieldPath is a string or undefined at this point.
         */
        path = (field.path as string) || field.field.storageId || field.field.id;
    }
    if (field.isSystemField) {
        return path;
    }
    return `values.${path}`;
};
