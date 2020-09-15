import gql from "graphql-tag";

export const LIST_FORMS = gql`
    query FormsListForms {
        forms {
            listForms(limit: 50) {
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
