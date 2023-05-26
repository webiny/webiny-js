import gql from "graphql-tag";
import { AcoAppMode, AcoModel } from "~/types";
import { ERROR_FIELD } from "./common";

export const createDeleteRecord = (model: AcoModel, mode: AcoAppMode) => {
    if (mode === "cms") {
        throw new Error(
            "User should not be allowed to delete a search record for the CMS base ACO App."
        );
    }
    const { singularApiName } = model;
    return gql`
        mutation Delete${singularApiName}($id: ID!) {
            search {
                deleteRecord: delete${singularApiName}(id: $id) {
                    data
                    ${ERROR_FIELD}
                }
            }
        }
    `;
};
