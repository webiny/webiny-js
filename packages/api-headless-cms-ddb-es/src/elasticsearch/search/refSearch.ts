import {
    CmsEntryElasticsearchQueryBuilderValueSearchPlugin,
    CreatePathCallable,
    TransformCallable
} from "~/plugins/CmsEntryElasticsearchQueryBuilderValueSearchPlugin";

interface RefValue {
    id?: string;
    entryId: string;
}

const createPath: CreatePathCallable<string> = ({ field, key }) => {
    if (key && key.match("entryId") === null) {
        return `${field.storageId}.id`;
    }
    return `${field.storageId}.entryId`;
};

const transform: TransformCallable<RefValue | string> = ({ value }) => {
    if (typeof value === "string") {
        return value;
    }
    if (value.id) {
        return value.id;
    }
    return value.entryId;
};

export const createRefSearchPlugin = (): CmsEntryElasticsearchQueryBuilderValueSearchPlugin => {
    return new CmsEntryElasticsearchQueryBuilderValueSearchPlugin({
        fieldType: "ref",
        path: createPath,
        transform
    });
};
