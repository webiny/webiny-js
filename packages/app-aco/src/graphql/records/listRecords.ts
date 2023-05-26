import gql from "graphql-tag";
import { AcoAppMode, AcoModel } from "~/types";
import { createAppFields, LIST_META_FIELD, ERROR_FIELD } from "./common";
import { createListQuery } from "@webiny/app-headless-cms-common";

export const createListRecords = (model: AcoModel, mode: AcoAppMode) => {
    if (mode === "cms") {
        return createListQuery(model);
    }
    const { singularApiName, pluralApiName } = model;
    return gql`
        query List${pluralApiName}($where: ${singularApiName}ListWhereInput, $limit: Int, $after: String, $sort: [${singularApiName}ListSorter!], $search: String) {
            search {
                listRecords: list${pluralApiName}(where: $where, limit: $limit, after: $after, sort: $sort, search: $search) {
                    data {
                        ${createAppFields(model)}
                    }
                    ${LIST_META_FIELD}
                    ${ERROR_FIELD}
                }
            }
        }
    `;
};
