import { ElasticsearchQueryBuilderValueSearchPlugin } from "~/types";

export default (): ElasticsearchQueryBuilderValueSearchPlugin => ({
    type: "cms-elastic-search-query-builder-value-search",
    name: "elastic-search-query-builder-value-search-time",
    fieldType: "datetime",
    transform: ({ field, value }) => {
        if (field.settings.type !== "time") {
            return value;
        }
        const [hours, minutes, seconds = 0] = value.split(":").map(Number);
        return hours * 60 * 60 + minutes * 60 + seconds;
    }
});
