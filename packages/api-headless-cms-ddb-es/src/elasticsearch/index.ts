import elasticsearchIndexingPlugins from "./indexing";
import elasticsearchSearchPlugins from "./search";

export default () => [elasticsearchIndexingPlugins(), elasticsearchSearchPlugins()];
