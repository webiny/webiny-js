import { FormElasticsearchFieldPlugin } from "~/plugins/FormElasticsearchFieldPlugin";

export default () => [
    /**
     * Always add the ALL fields plugin because of the keyword/path build.
     */
    new FormElasticsearchFieldPlugin({
        field: FormElasticsearchFieldPlugin.ALL
    })
];
