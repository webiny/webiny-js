import gql from "graphql-tag";
import { AcoAppMode, AcoModel } from "~/types";
import { createAppFields, ERROR_FIELD } from "./common";

export const createUpdateRecord = (model: AcoModel, mode: AcoAppMode) => {
    if (mode === "cms") {
        return null;
    }
    const { singularApiName } = model;
    return gql`
        mutation Update${singularApiName}($id: ID!, $data: ${singularApiName}UpdateInput!) {
            search {
                content: update${singularApiName}(id: $id, data: $data) {
                    data {
                        ${createAppFields(model)}
                    }
                    ${ERROR_FIELD}
                }
            }
        }
    `;
};
