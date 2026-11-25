import { Result } from "../../Result.js";
import { createMethod } from "../../utils/createMethod.js";
import { buildFieldsSelection } from "../fileManager/buildFieldsSelection.js";
import { getPageByIdSchema } from "./schemas.js";
import { executeWbOperation } from "./executeWbOperation.js";
import type { WbPage } from "./websiteBuilderTypes.js";

export interface GetPageByIdParams {
    /** Revision id, e.g. "abc123#0001". */
    id: string;
    /** `true` returns the page as stored; by default it's delivered composed (global instances added). */
    raw?: boolean;
    fields: string[];
}

export const getPageById = createMethod(getPageByIdSchema, async (config, fetchFn, params) => {
    const { id, raw, fields } = params as GetPageByIdParams;
    const result = await executeWbOperation<WbPage>(config, fetchFn, {
        type: "query",
        operation: "getPageById",
        variableDefinitions: "$id: ID!, $raw: Boolean",
        args: "id: $id, raw: $raw",
        selection: buildFieldsSelection(fields),
        variables: { id, raw },
        fields
    });
    return result.isFail() ? Result.fail(result.error) : Result.ok(result.value.data);
});
