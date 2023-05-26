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
        query Get${singularApiName}($id: ID!) {
            search {
                getRecord: get${singularApiName}(id: $id) {
                    data {
                        ${createAppFields(model)}
                    }
                    ${ERROR_FIELD}
                }
            }
        }
    `;
};
