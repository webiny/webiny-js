import {
    CmsEntryElasticsearchQueryBuilderValueSearchPlugin,
    CreatePathCallable,
    TransformCallable
} from "~/plugins/CmsEntryElasticsearchQueryBuilderValueSearchPlugin";

const createPath: CreatePathCallable<string> = params => {
    const value = `${params.value || ""}`;
    const target = value && value.includes("#") ? "id" : "entryId";
    return `${params.field.fieldId}.${target}`;
};

const transform: TransformCallable<string> = params => {
    return params.value;
};

export const createRefSearchPlugin = (): CmsEntryElasticsearchQueryBuilderValueSearchPlugin => {
    return new CmsEntryElasticsearchQueryBuilderValueSearchPlugin({
        fieldType: "ref",
        path: createPath,
        transform
    });
};
