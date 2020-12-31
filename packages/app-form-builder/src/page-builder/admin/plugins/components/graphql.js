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
