import {
    CmsEntryElasticsearchQueryBuilderValueSearchPlugin,
    CreatePathCallable,
    TransformCallable
} from "~/plugins/CmsEntryElasticsearchQueryBuilderValueSearchPlugin";

const createPath: CreatePathCallable<string> = ({ field, key }) => {
    if (key && key.match("entryId") === null) {
        return `${field.storageId}.id`;
    }
    return `${field.storageId}.entryId`;
};

const transform: TransformCallable = ({ value }) => {
    return value;
};

export const createRefSearchPlugin = (): CmsEntryElasticsearchQueryBuilderValueSearchPlugin => {
    return new CmsEntryElasticsearchQueryBuilderValueSearchPlugin({
        fieldType: "ref",
        path: createPath,
        transform
    });
};
