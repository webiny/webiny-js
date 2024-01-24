import gql from "graphql-tag";
import { AcoAppMode, AcoModel } from "~/types";
import { createAppFields, ERROR_FIELD, LIST_META_FIELD } from "./common";
import { createListQuery } from "@webiny/app-headless-cms-common";

export const createListRecords = (model: AcoModel, mode: AcoAppMode) => {
    if (mode === "cms") {
        return createListQuery(
            model,
            /**
             * We will include only the simplest fields.
             * TODO: possibly have only searchable / sortable fields here?
             * We could do that if we fetched the information from the API side - we do not have that information in the UI.
             */
            model.fields.filter(field => {
                /**
                 * Filter out by field type for start.
                 */
                const filtered = [
                    "text",
                    "number",
                    "boolean",
                    "file",
                    "long-text",
                    "ref",
                    "datetime"
                ].includes(field.type);
                if (!filtered) {
                    return false;
                }
                /**
                 * Then we need to check the field settings.
                 */
                if (field.settings?.aco?.list === false) {
                    return false;
                }
                return true;
            })
        );
    }
    const { singularApiName, pluralApiName } = model;
    return gql`
        query List${pluralApiName}($where: ${singularApiName}ListWhereInput, $limit: Int, $after: String, $sort: [${singularApiName}ListSorter!], $search: String) {
            search {
                content: list${pluralApiName}(where: $where, limit: $limit, after: $after, sort: $sort, search: $search) {
                    data {
                        ${createAppFields(model, true)}
                    }
                    ${LIST_META_FIELD}
                    ${ERROR_FIELD}
                }
            }
        }
    `;
};
