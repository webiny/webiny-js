import { ElasticsearchQueryBuilderValueSearchPlugin } from "../../types";

export default (): ElasticsearchQueryBuilderValueSearchPlugin => ({
    type: "cms-elastic-search-query-builder-value-search",
    name: "cms-elastic-search-query-builder-value-search-ref-field",
    fieldType: "ref",
    transform: ({ value }) => {
        return value;
    },
    createPath: ({ field }) => {
        return `values.${field.fieldId}.entryId`;
    }
});
