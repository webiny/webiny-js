import gql from "graphql-tag";

import { PageTemplate } from "../state";
import { useQuery } from "@webiny/app-headless-cms/admin/hooks";

const GET_MODEL_ENTRIES = gql`
    query searchContentEntities(
        $modelIds: [ID!]!
        $query: String
        $fields: [String!]
        $limit: Int
    ) {
        result: searchContentEntries(
            modelIds: $modelIds
            query: $query
            fields: $fields
            limit: $limit
        ) {
            data {
                id
                entryId
                status
                title
                description
                image
                createdOn
                savedOn
                createdBy {
                    id
                    type
                    displayName
                }
                modifiedBy {
                    id
                    type
                    displayName
                }
                model {
                    modelId
                    name
                }
                published {
                    id
                    entryId
                    title
                }
            }
            error {
                code
                message
                data
            }
        }
    }
`;
export const useGetModelEntries = (templateAtomValue: PageTemplate) => {
    const { data, loading } = useQuery(GET_MODEL_ENTRIES, {
        variables: {
            modelIds: [templateAtomValue?.sourceModel?.modelId]
        }
    });

    return { data, loading };
};
