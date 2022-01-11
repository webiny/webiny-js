import gql from "graphql-tag";

export const createListModelsQuery = () => {
    return gql`
        query CmsListContentModels {
            listContentModels {
                data {
                    modelId
                    name
                    fields {
                        id
                        type
                    }
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
