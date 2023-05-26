import gql from "graphql-tag";
import { AcoAppMode, AcoModel } from "~/types";
import { createAppFields, ERROR_FIELD } from "./common";

export const createUpdateRecord = (model: AcoModel, mode: AcoAppMode) => {
    if (mode === "cms") {
        throw new Error(
            "User should not be allowed to update a search record for the CMS base ACO App."
        );
    }
    const { singularApiName } = model;
    return gql`
        mutation Update${singularApiName}($id: ID!, $data: ${singularApiName}UpdateInput!) {
            search {
                updateRecord: update${singularApiName}(id: $id, data: $data) {
                    data {
                        ${createAppFields(model)}
                    }
                    ${ERROR_FIELD}
                }
            }
        }
    `;
};
