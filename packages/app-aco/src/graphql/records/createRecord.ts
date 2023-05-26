import gql from "graphql-tag";
import { AcoAppMode, AcoModel } from "~/types";
import { createAppFields, ERROR_FIELD } from "./common";

export const createCreateRecord = (model: AcoModel, mode: AcoAppMode) => {
    if (mode === "cms") {
        throw new Error(
            "User should not be allowed to create a search record for the CMS base ACO App."
        );
    }
    const { singularApiName } = model;
    return gql`
        mutation Create${singularApiName}($data: ${singularApiName}CreateInput!) {
            search {
                createRecord: create${singularApiName}(data: $data) {
                    data {
                        ${createAppFields(model)}
                    }
                    ${ERROR_FIELD}
                }
            }
        }
    `;
};
