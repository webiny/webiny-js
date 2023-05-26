import gql from "graphql-tag";
import { AcoAppMode, AcoModel } from "~/types";
import { ERROR_FIELD, LIST_META_FIELD } from "./common";

export const createListTags = (model: AcoModel, mode: AcoAppMode) => {
    if (mode === "cms") {
        throw new Error("User should not be allowed to list tags for the CMS base ACO App.");
    }
    const { pluralApiName } = model;
    return gql`
        query List${pluralApiName}Tags($where: AcoSearchRecordTagListWhereInput) {
            search {
                listTags: list${pluralApiName}Tags(where: $where) {
                    data {
                        tag
                    }
                    ${LIST_META_FIELD}
                    ${ERROR_FIELD}
                }
            }
        }
    `;
};
