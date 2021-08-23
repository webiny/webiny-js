import { PageElasticsearchFieldPlugin } from "~/plugins/definitions/PageElasticsearchFieldPlugin";

export default () => [
    new PageElasticsearchFieldPlugin({
        field: "createdOn",
        unmappedType: "date"
    }),
    new PageElasticsearchFieldPlugin({
        field: "createdBy",
        path: "createdBy.id"
    }),
    /**
     * Defines all fields that are not strictly defined.
     */
    new PageElasticsearchFieldPlugin({
        field: "*"
    })
];
