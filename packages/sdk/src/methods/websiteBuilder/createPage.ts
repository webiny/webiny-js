import { Result } from "../../Result.js";
import { createMethod } from "../../utils/createMethod.js";
import { buildFieldsSelection } from "../fileManager/buildFieldsSelection.js";
import { createPageSchema } from "./schemas.js";
import { executeWbOperation } from "./executeWbOperation.js";
import type { WbPage, WbPageCreateInput } from "./websiteBuilderTypes.js";

export interface CreatePageParams {
    data: WbPageCreateInput;
    fields: string[];
}

export const createPage = createMethod(createPageSchema, async (config, fetchFn, params) => {
    const { data, fields } = params as CreatePageParams;
    const result = await executeWbOperation<WbPage>(config, fetchFn, {
        type: "mutation",
        operation: "createPage",
        variableDefinitions: "$data: WbPageCreateInput!",
        args: "data: $data",
        selection: buildFieldsSelection(fields),
        variables: { data },
        fields
    });
    return result.isFail() ? Result.fail(result.error) : Result.ok(result.value.data);
});
