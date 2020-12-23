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

export const GET_FORM = gql`
    query FormsGetForm($id: ID!) {
        formBuilder {
            getForm(id: $id) {
                data {
                    id
                    revisions {
                        id
                        name
                        published
                        version
                    }
                }
            }
        }
    }
`;
