import gql from "graphql-tag";
import { AcoAppMode, AcoModel } from "~/types";
import { createAppFields, ERROR_FIELD } from "./common";
import { createReadQuery } from "@webiny/app-headless-cms-common";

export const createGetRecord = (model: AcoModel, mode: AcoAppMode) => {
    if (mode === "cms") {
        return createReadQuery(model);
    }
    const { singularApiName } = model;
    return gql`
        query Get${singularApiName}($entryId: ID!) {
            search {
                content: get${singularApiName}(id: $entryId) {
                    data {
                        ${createAppFields(model)}
                    }
                    ${ERROR_FIELD}
                }
            }
        }
    `;
};
