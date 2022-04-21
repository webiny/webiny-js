import { FormElasticsearchIndexTemplatePlugin } from "~/plugins/FormElasticsearchIndexTemplatePlugin";
import { base as baseGeneral } from "@webiny/api-elasticsearch/indexConfiguration/base";

export const base = new FormElasticsearchIndexTemplatePlugin({
    name: "form-builder-forms-index-default",
    order: 150,
    body: {
        ...baseGeneral,
        index_patterns: ["*-form-builder"],
        aliases: {}
    }
});
