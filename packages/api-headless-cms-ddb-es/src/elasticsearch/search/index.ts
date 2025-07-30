import { createTimeSearchPlugin } from "./timeSearch";
import { createRefSearchPlugin } from "./refSearch";
import { createSearchableJsonSearchPlugin } from "./searchableJson.js";
import type { CmsEntryElasticsearchQueryBuilderValueSearchPlugin } from "~/plugins/CmsEntryElasticsearchQueryBuilderValueSearchPlugin";

export default (): CmsEntryElasticsearchQueryBuilderValueSearchPlugin[] => [
    createTimeSearchPlugin(),
    createRefSearchPlugin(),
    createSearchableJsonSearchPlugin()
];
