import { Result } from "../../Result.js";
import { createMethod } from "../../utils/createMethod.js";
import { buildFieldsSelection } from "../fileManager/buildFieldsSelection.js";
import { updatePageSchema } from "./schemas.js";
import { executeWbOperation } from "./executeWbOperation.js";
import type { WbPage, WbPageInput } from "./websiteBuilderTypes.js";

export interface UpdatePageParams {
    /** Revision id. A published revision is locked: create a new revision first. */
    id: string;
    data: WbPageInput;
    fields: string[];
}

export const updatePage = createMethod(updatePageSchema, async (config, fetchFn, params) => {
    const { id, data, fields } = params as UpdatePageParams;
    const result = await executeWbOperation<WbPage>(config, fetchFn, {
        type: "mutation",
        operation: "updatePage",
        variableDefinitions: "$id: ID!, $data: WbPageUpdateInput!",
        args: "id: $id, data: $data",
        selection: buildFieldsSelection(fields),
        variables: { id, data },
        fields
    });
    return result.isFail() ? Result.fail(result.error) : Result.ok(result.value.data);
});
