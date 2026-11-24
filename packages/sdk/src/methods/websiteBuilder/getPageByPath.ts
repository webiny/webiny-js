import { Result } from "../../Result.js";
import { createMethod } from "../../utils/createMethod.js";
import { buildFieldsSelection } from "../fileManager/buildFieldsSelection.js";
import { getPageByPathSchema } from "./schemas.js";
import { executeWbOperation } from "./executeWbOperation.js";
import type { WbPage } from "./websiteBuilderTypes.js";

export interface GetPageByPathParams {
    path: string;
    fields: string[];
}

export const getPageByPath = createMethod(getPageByPathSchema, async (config, fetchFn, params) => {
    const { path, fields } = params as GetPageByPathParams;
    const result = await executeWbOperation<WbPage>(config, fetchFn, {
        type: "query",
        operation: "getPageByPath",
        variableDefinitions: "$path: String!",
        args: "path: $path",
        selection: buildFieldsSelection(fields),
        variables: { path },
        fields
    });
    return result.isFail() ? Result.fail(result.error) : Result.ok(result.value.data);
});
