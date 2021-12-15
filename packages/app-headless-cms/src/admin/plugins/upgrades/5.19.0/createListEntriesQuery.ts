import { CmsEditorContentModel } from "~/types";
import upperFirst from "lodash/upperFirst";
import pluralize from "pluralize";
import gql from "graphql-tag";

export const createListEntriesQuery = (model: CmsEditorContentModel) => {
    const ucFirstPluralizedModelId = upperFirst(pluralize(model.modelId));
    const ucFirstModelId = upperFirst(model.modelId);

    return gql`
        query CmsEntriesList${ucFirstPluralizedModelId}($where: ${ucFirstModelId}ListWhereInput, $sort: [${ucFirstModelId}ListSorter], $limit: Int, $after: String) {
            content: list${ucFirstPluralizedModelId}(
            where: $where
            sort: $sort
            limit: $limit
            after: $after
            ) {
            data {
                id
            }
            meta {
                cursor
                hasMoreItems
                totalCount
            }
            error {
                message
                code
                data
            }
        }
        }
    `;
};
