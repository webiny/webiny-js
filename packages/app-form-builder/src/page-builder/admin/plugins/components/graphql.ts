import gql from "graphql-tag";
import { FbErrorResponse, FbFormModel, FbRevisionModel } from "~/types";

/**
 * ##################
 * List Forms Query
 */
export interface ListFormsQueryResponse {
    formBuilder: {
        listForms: {
            data: Pick<FbFormModel, "id" | "name">[];
            error: FbErrorResponse | null;
        };
    };
}
export const LIST_FORMS = gql`
    query FormsListForms {
        formBuilder {
            listForms {
                data {
                    id
                    name
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
/**
 * ########################
 * Get Form Revisions Query
 */
export interface GetFormRevisionsQueryResponse {
    formBuilder: {
        getFormRevisions: {
            data: FbRevisionModel[];
            error: FbErrorResponse | null;
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
