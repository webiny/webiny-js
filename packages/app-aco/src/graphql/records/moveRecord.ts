import gql from "graphql-tag";
import { AcoModel } from "~/types";
import { ERROR_FIELD } from "./common";

export const createMoveRecord = (model: AcoModel) => {
    const { singularApiName } = model;
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
