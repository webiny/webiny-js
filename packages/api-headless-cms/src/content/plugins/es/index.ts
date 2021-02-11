import { elasticSearchQueryBuilderBetweenPlugin } from "./elasticSearchQueryBuilderBetweenPlugin";
import { elasticSearchQueryBuilderContainsPlugin } from "./elasticSearchQueryBuilderContainsPlugin";
import { elasticSearchQueryBuilderEqualPlugin } from "./elasticSearchQueryBuilderEqualPlugin";
import { elasticSearchQueryBuilderInPlugin } from "./elasticSearchQueryBuilderInPlugin";
import { elasticSearchQueryBuilderNotBetweenPlugin } from "./elasticSearchQueryBuilderNotBetweenPlugin";
import { elasticSearchQueryBuilderNotPlugin } from "./elasticSearchQueryBuilderNotPlugin";
import { elasticSearchQueryBuilderNotContainsPlugin } from "./elasticSearchQueryBuilderNotContainsPlugin";
import { elasticSearchQueryBuilderNotInPlugin } from "./elasticSearchQueryBuilderNotInPlugin";
import { elasticSearchQueryBuilderGtePlugin } from "./elasticSearchQueryBuilderGtePlugin";
import { elasticSearchQueryBuilderGtPlugin } from "./elasticSearchQueryBuilderGtPlugin";
import { elasticSearchQueryBuilderLtePlugin } from "./elasticSearchQueryBuilderLtePlugin";
import { elasticSearchQueryBuilderLtPlugin } from "./elasticSearchQueryBuilderLtPlugin";
import elasticSearchIndexingPlugins from "./indexing";
import elasticSearchSearchPlugins from "./search";

export default () => [
    elasticSearchQueryBuilderBetweenPlugin(),
    elasticSearchQueryBuilderContainsPlugin(),
    elasticSearchQueryBuilderEqualPlugin(),
    elasticSearchQueryBuilderInPlugin(),
    elasticSearchQueryBuilderNotBetweenPlugin(),
    elasticSearchQueryBuilderNotContainsPlugin(),
    elasticSearchQueryBuilderNotInPlugin(),
    elasticSearchQueryBuilderNotPlugin(),
    elasticSearchQueryBuilderGtePlugin(),
    elasticSearchQueryBuilderGtPlugin(),
    elasticSearchQueryBuilderLtePlugin(),
    elasticSearchQueryBuilderLtPlugin(),
    elasticSearchIndexingPlugins(),
    elasticSearchSearchPlugins()
];
