import { ElasticsearchQueryBuilderOperatorBetweenPlugin } from "~/plugins/operator/between";
import { ElasticsearchQueryBuilderOperatorNotBetweenPlugin } from "~/plugins/operator/notBetween";
import { ElasticsearchQueryBuilderOperatorContainsPlugin } from "~/plugins/operator/contains";
import { ElasticsearchQueryBuilderOperatorNotContainsPlugin } from "~/plugins/operator/notContains";
import { ElasticsearchQueryBuilderOperatorEqualPlugin } from "~/plugins/operator/equal";
import { ElasticsearchQueryBuilderOperatorNotPlugin } from "~/plugins/operator/not";
import { ElasticsearchQueryBuilderOperatorGreaterThanPlugin } from "~/plugins/operator/gt";
import { ElasticsearchQueryBuilderOperatorGreaterThanOrEqualToPlugin } from "~/plugins/operator/gte";
import { ElasticsearchQueryBuilderOperatorLesserThanPlugin } from "~/plugins/operator/lt";
import { ElasticsearchQueryBuilderOperatorLesserThanOrEqualToPlugin } from "~/plugins/operator/lte";
import { ElasticsearchQueryBuilderOperatorInPlugin } from "~/plugins/operator/in";
import { ElasticsearchQueryBuilderOperatorAndInPlugin } from "~/plugins/operator/andIn";
import { ElasticsearchQueryBuilderOperatorNotInPlugin } from "~/plugins/operator/notIn";

export const getOperators = () => [
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
    new ElasticsearchQueryBuilderOperatorNotInPlugin()
];
