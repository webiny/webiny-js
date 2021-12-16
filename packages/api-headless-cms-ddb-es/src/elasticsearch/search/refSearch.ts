import {
    CmsEntryElasticsearchQueryBuilderValueSearchPlugin,
    CreatePathCallable,
    TransformCallable
} from "~/plugins/CmsEntryElasticsearchQueryBuilderValueSearchPlugin";

const createPath: CreatePathCallable<string> = ({ field, key }) => {
    if (key && key.match("entryId") === null) {
        return `${field.fieldId}.id`;
    }
    return `${field.fieldId}.entryId`;
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
