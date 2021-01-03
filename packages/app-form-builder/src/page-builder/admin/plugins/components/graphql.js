import gql from "graphql-tag";

export const LIST_FORMS = gql`
    query FormsListForms {
        formBuilder {
            listForms {
                data {
                    id
                    name
                }
            }
        }
    }
`;

export const GET_FORM_REVISIONS = gql`
    query FormsGetFormRevisions($id: ID!) {
        formBuilder {
            getFormRevisions(id: $id) {
                data {
                    id
                    name
                    published
                    version
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;
