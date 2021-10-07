import { SubmissionElasticsearchFieldPlugin } from "~/plugins/SubmissionElasticsearchFieldPlugin";

export default () => [
    new SubmissionElasticsearchFieldPlugin({
        field: "parent",
        path: "form.parent"
    }),
    new SubmissionElasticsearchFieldPlugin({
        field: "ownedBy",
        path: "ownedBy.id"
    }),
    new SubmissionElasticsearchFieldPlugin({
        field: "createdOn",
        unmappedType: "date"
    }),
    new SubmissionElasticsearchFieldPlugin({
        field: "savedOn",
        unmappedType: "date"
    }),
    /**
     * Always add the ALL fields plugin because of the keyword/path build.
     */
    new SubmissionElasticsearchFieldPlugin({
        field: SubmissionElasticsearchFieldPlugin.ALL
    })
];
