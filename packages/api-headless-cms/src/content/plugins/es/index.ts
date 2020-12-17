import { elasticSearchQueryBuilderBetweenPlugin } from "./elasticSearchQueryBuilderBetweenPlugin";
import { elasticSearchQueryBuilderContainsPlugin } from "./elasticSearchQueryBuilderContainsPlugin";
import { elasticSearchQueryBuilderEqualPlugin } from "./elasticSearchQueryBuilderEqualPlugin";
import { elasticSearchQueryBuilderInPlugin } from "./elasticSearchQueryBuilderInPlugin";
import { elasticSearchQueryBuilderNotBetweenPlugin } from "./elasticSearchQueryBuilderNotBetweenPlugin";
import { elasticSearchQueryBuilderNotPlugin } from "./elasticSearchQueryBuilderNotPlugin";
import { elasticSearchQueryBuilderNotContainsPlugin } from "./elasticSearchQueryBuilderNotContainsPlugin";
import { elasticSearchQueryBuilderNotInPlugin } from "./elasticSearchQueryBuilderNotInPlugin";

export default () => [
    elasticSearchQueryBuilderBetweenPlugin(),
    elasticSearchQueryBuilderContainsPlugin(),
    elasticSearchQueryBuilderEqualPlugin(),
    elasticSearchQueryBuilderInPlugin(),
    elasticSearchQueryBuilderNotBetweenPlugin(),
    elasticSearchQueryBuilderNotContainsPlugin(),
    elasticSearchQueryBuilderNotInPlugin(),
    elasticSearchQueryBuilderNotPlugin()
];
