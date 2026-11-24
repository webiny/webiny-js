import { Result } from "../../Result.js";
import { createMethod } from "../../utils/createMethod.js";
import { buildFieldsSelection } from "../fileManager/buildFieldsSelection.js";
import { pageActionSchema } from "./schemas.js";
import { executeWbOperation } from "./executeWbOperation.js";
import type { WbPage } from "./websiteBuilderTypes.js";

export interface UnpublishPageParams {
    /** Revision id. */
    id: string;
    fields: string[];
}

/** Unpublishes a page revision. */
export const unpublishPage = createMethod(pageActionSchema, async (config, fetchFn, params) => {
    const { id, fields } = params as UnpublishPageParams;
    const result = await executeWbOperation<WbPage>(config, fetchFn, {
        type: "mutation",
        operation: "unpublishPage",
        variableDefinitions: "$id: ID!",
        args: "id: $id",
        selection: buildFieldsSelection(fields),
        variables: { id },
        fields
    });
    return result.isFail() ? Result.fail(result.error) : Result.ok(result.value.data);
});
