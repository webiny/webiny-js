import {
    OpenSearchQueryBuilderOperatorBetweenPlugin,
    OpenSearchQueryBuilderOperatorAndInPlugin,
    OpenSearchQueryBuilderOperatorGreaterThanOrEqualToPlugin,
    OpenSearchQueryBuilderOperatorGreaterThanPlugin,
    OpenSearchQueryBuilderOperatorContainsPlugin,
    OpenSearchQueryBuilderOperatorLesserThanOrEqualToPlugin,
    OpenSearchQueryBuilderOperatorInPlugin,
    OpenSearchQueryBuilderOperatorLesserThanPlugin,
    OpenSearchQueryBuilderOperatorNotBetweenPlugin,
    OpenSearchQueryBuilderOperatorNotContainsPlugin,
    OpenSearchQueryBuilderOperatorNotPlugin,
    OpenSearchQueryBuilderOperatorNotInPlugin,
    OpenSearchQueryBuilderOperatorEqualPlugin,
    OpenSearchQueryBuilderOperatorStartsWithPlugin,
    OpenSearchQueryBuilderOperatorNotStartsWithPlugin
} from "~/plugins/operator/index.js";

const operators = [
    new OpenSearchQueryBuilderOperatorBetweenPlugin(),
    new OpenSearchQueryBuilderOperatorNotBetweenPlugin(),
    new OpenSearchQueryBuilderOperatorContainsPlugin(),
    new OpenSearchQueryBuilderOperatorNotContainsPlugin(),
    new OpenSearchQueryBuilderOperatorEqualPlugin(),
    new OpenSearchQueryBuilderOperatorNotPlugin(),
    new OpenSearchQueryBuilderOperatorGreaterThanPlugin(),
    new OpenSearchQueryBuilderOperatorGreaterThanOrEqualToPlugin(),
    new OpenSearchQueryBuilderOperatorLesserThanPlugin(),
    new OpenSearchQueryBuilderOperatorLesserThanOrEqualToPlugin(),
    new OpenSearchQueryBuilderOperatorInPlugin(),
    new OpenSearchQueryBuilderOperatorAndInPlugin(),
    new OpenSearchQueryBuilderOperatorNotInPlugin(),
    new OpenSearchQueryBuilderOperatorStartsWithPlugin(),
    new OpenSearchQueryBuilderOperatorNotStartsWithPlugin()
];
/**
 * We export as a function because there might be something to be sent to the operators at some point.
 * This way, we make it easier to upgrade.
 */
export const getOpenSearchOperators = () => operators;
