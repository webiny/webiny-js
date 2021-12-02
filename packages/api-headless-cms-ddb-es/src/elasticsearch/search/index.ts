import { createTimeSearchPlugin } from "./timeSearch";
import { createRefSearchPlugin } from "./refSearch";
import { CmsEntryElasticsearchQueryBuilderValueSearchPlugin } from "~/plugins/CmsEntryElasticsearchQueryBuilderValueSearchPlugin";

export default (): CmsEntryElasticsearchQueryBuilderValueSearchPlugin[] => [
    createTimeSearchPlugin(),
    createRefSearchPlugin()
];
