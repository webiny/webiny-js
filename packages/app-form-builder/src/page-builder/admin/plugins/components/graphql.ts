import gql from "graphql-tag";
import { FbErrorResponse, FbRevisionModel } from "~/types";

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
/**
 * ########################
 * Get Form Revisions Query
 */
export interface GetFormRevisionsQueryResponse {
    formBuilder: {
        getFormRevisions: {
            data: FbRevisionModel[];
            error?: FbErrorResponse;
        };
    };
}
export interface GetFormRevisionsQueryVariables {
    id: string;
}
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
