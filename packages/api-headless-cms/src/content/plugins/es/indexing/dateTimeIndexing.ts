import { CmsModelFieldToElasticSearchPlugin } from "@webiny/api-headless-cms/types";

export default (): CmsModelFieldToElasticSearchPlugin => ({
    type: "cms-model-field-to-elastic-search",
    name: "cms-model-field-to-elastic-search-datetime",
    fieldType: "datetime",
    unmappedType: "date"
});
