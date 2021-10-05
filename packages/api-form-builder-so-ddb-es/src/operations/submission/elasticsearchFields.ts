import { SubmissionElasticsearchFieldPlugin } from "~/plugins/SubmissionElasticsearchFieldPlugin";

export default () => [
    new SubmissionElasticsearchFieldPlugin({
        field: "parent",
        path: "form.parent",
        keyword: true
    }),
    /**
     * Always add the ALL fields plugin because of the keyword/path build.
     */
    new SubmissionElasticsearchFieldPlugin({
        field: SubmissionElasticsearchFieldPlugin.ALL
    })
];
