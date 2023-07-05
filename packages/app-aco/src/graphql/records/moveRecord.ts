import gql from "graphql-tag";
import { AcoAppMode, AcoModel } from "~/types";
import { ERROR_FIELD } from "./common";

export const createMoveRecord = (model: AcoModel, mode: AcoAppMode) => {
    const { singularApiName } = model;
    if (mode === "cms") {
        return gql`
            mutation Move${singularApiName}($id: ID!, $folderId: ID!) {
                content: move${singularApiName}(revision: $id, folderId: $folderId) {
                    data
                    ${ERROR_FIELD}
                }
            }
        `;
    }
    return gql`
        mutation Move${singularApiName}($id: ID!, $folderId: ID!) {
            search {
                content: move${singularApiName}(id: $id, folderId: $folderId) {
                    data
                    ${ERROR_FIELD}
                }
            }
        }
    `;
};
