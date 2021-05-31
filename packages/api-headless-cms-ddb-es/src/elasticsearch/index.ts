import { elasticsearchOperatorBetweenPlugin } from "./operators/between";
import { elasticsearchOperatorContainsPlugin } from "./operators/contains";
import { elasticsearchOperatorEqualPlugin } from "./operators/equal";
import { elasticsearchOperatorInPlugin } from "./operators/in";
import { elasticsearchOperatorNotBetweenPlugin } from "./operators/notBetween";
import { elasticsearchOperatorNotPlugin } from "./operators/not";
import { elasticsearchOperatorNotContainsPlugin } from "./operators/notContains";
import { elasticsearchOperatorNotInPlugin } from "./operators/notIn";
import { elasticsearchOperatorGtePlugin } from "./operators/gte";
import { elasticsearchOperatorGtPlugin } from "./operators/gt";
import { elasticsearchOperatorLtePlugin } from "./operators/lte";
import { elasticsearchOperatorLtPlugin } from "./operators/lt";
import elasticSearchIndexingPlugins from "./indexing";
import elasticSearchSearchPlugins from "./search";

export default () => [
    elasticsearchOperatorBetweenPlugin(),
    elasticsearchOperatorContainsPlugin(),
    elasticsearchOperatorEqualPlugin(),
    elasticsearchOperatorInPlugin(),
    elasticsearchOperatorNotBetweenPlugin(),
    elasticsearchOperatorNotContainsPlugin(),
    elasticsearchOperatorNotInPlugin(),
    elasticsearchOperatorNotPlugin(),
    elasticsearchOperatorGtePlugin(),
    elasticsearchOperatorGtPlugin(),
    elasticsearchOperatorLtePlugin(),
    elasticsearchOperatorLtPlugin(),
    elasticSearchIndexingPlugins(),
    elasticSearchSearchPlugins()
];
