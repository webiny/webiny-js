import {
    ElasticsearchQueryBuilderOperatorBetweenPlugin,
    ElasticsearchQueryBuilderOperatorAndInPlugin,
    ElasticsearchQueryBuilderOperatorGreaterThanOrEqualToPlugin,
    ElasticsearchQueryBuilderOperatorGreaterThanPlugin,
    ElasticsearchQueryBuilderOperatorContainsPlugin,
    ElasticsearchQueryBuilderOperatorLesserThanOrEqualToPlugin,
    ElasticsearchQueryBuilderOperatorInPlugin,
    ElasticsearchQueryBuilderOperatorLesserThanPlugin,
    ElasticsearchQueryBuilderOperatorNotBetweenPlugin,
    ElasticsearchQueryBuilderOperatorNotContainsPlugin,
    ElasticsearchQueryBuilderOperatorNotPlugin,
    ElasticsearchQueryBuilderOperatorNotInPlugin,
    ElasticsearchQueryBuilderOperatorEqualPlugin,
    ElasticsearchQueryBuilderOperatorStartsWithPlugin,
    ElasticsearchQueryBuilderOperatorNotStartsWithPlugin
} from "~/plugins/operator/index.js";

const operators = [
    new ElasticsearchQueryBuilderOperatorBetweenPlugin(),
    new ElasticsearchQueryBuilderOperatorNotBetweenPlugin(),
    new ElasticsearchQueryBuilderOperatorContainsPlugin(),
    new ElasticsearchQueryBuilderOperatorNotContainsPlugin(),
    new ElasticsearchQueryBuilderOperatorEqualPlugin(),
    new ElasticsearchQueryBuilderOperatorNotPlugin(),
    new ElasticsearchQueryBuilderOperatorGreaterThanPlugin(),
    new ElasticsearchQueryBuilderOperatorGreaterThanOrEqualToPlugin(),
    new ElasticsearchQueryBuilderOperatorLesserThanPlugin(),
    new ElasticsearchQueryBuilderOperatorLesserThanOrEqualToPlugin(),
    new ElasticsearchQueryBuilderOperatorInPlugin(),
    new ElasticsearchQueryBuilderOperatorAndInPlugin(),
    new ElasticsearchQueryBuilderOperatorNotInPlugin(),
    new ElasticsearchQueryBuilderOperatorStartsWithPlugin(),
    new ElasticsearchQueryBuilderOperatorNotStartsWithPlugin()
];
/**
 * We export as a function because there might be something to be sent to the operators at some point.
 * This way, we make it easier to upgrade.
 */
export const getElasticsearchOperators = () => operators;
