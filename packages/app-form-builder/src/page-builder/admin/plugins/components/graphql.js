import gql from "graphql-tag";

export const LIST_FORMS = gql`
    query FormsListForms {
        forms {
            listForms(perPage: 50) {
                data {
                    parent
                    name
                    publishedRevisions {
                        id
                        name
                        version
                        published
                    }
                }
            }
        }
    }
`;
