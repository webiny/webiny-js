import {
    CmsEntryElasticsearchQueryBuilderValueSearchPlugin,
    TransformCallable
} from "~/plugins/CmsEntryElasticsearchQueryBuilderValueSearchPlugin";

const transform: TransformCallable = params => {
    const { field, value } = params;
    if (!value || field.settings?.type !== "time") {
        return value;
    }
    const [hours, minutes, seconds = 0] = value.split(":").map(Number);
    return hours * 60 * 60 + minutes * 60 + seconds;
};

export const createTimeSearchPlugin = (): CmsEntryElasticsearchQueryBuilderValueSearchPlugin => {
    return new CmsEntryElasticsearchQueryBuilderValueSearchPlugin({
        fieldType: "datetime",
        transform
    });
};
