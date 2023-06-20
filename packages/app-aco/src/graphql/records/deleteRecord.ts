import gql from "graphql-tag";
import { AcoAppMode, AcoModel } from "~/types";
import { ERROR_FIELD } from "./common";

export const createDeleteRecord = (model: AcoModel, mode: AcoAppMode) => {
    if (mode === "cms") {
        return null;
    }
    const { singularApiName } = model;
    return gql`
        mutation Delete${singularApiName}($id: ID!) {
            search {
                content: delete${singularApiName}(id: $id) {
                    data
                    ${ERROR_FIELD}
                }
            }
        }
    `;
};
