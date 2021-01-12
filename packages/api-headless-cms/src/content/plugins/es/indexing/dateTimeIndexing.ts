import { CmsModelFieldToElasticsearchPlugin } from "@webiny/api-headless-cms/types";

export default (): CmsModelFieldToElasticsearchPlugin => ({
    type: "cms-model-field-to-elastic-search",
    name: "cms-model-field-to-elastic-search-datetime",
    fieldType: "datetime",
    unmappedType: "date"
});
