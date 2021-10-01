import { SubmissionElasticsearchFieldPlugin } from "~/plugins/SubmissionElasticsearchFieldPlugin";

export default () => [
    new SubmissionElasticsearchFieldPlugin({
        field: "parent",
        path: "form.parent",
        keyword: true
    })
];
