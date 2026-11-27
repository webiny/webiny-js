import { Result } from "../../Result.js";
import { createMethod } from "../../utils/createMethod.js";
import { buildFieldsSelection } from "../fileManager/buildFieldsSelection.js";
import { pageActionSchema } from "./schemas.js";
import { executeWbOperation } from "./executeWbOperation.js";
import type { WbPage } from "./websiteBuilderTypes.js";

export interface CreatePageRevisionFromParams {
    /** Revision id. */
    id: string;
    fields: string[];
}

/** Creates a new draft revision from an existing one (e.g. to edit a published, locked revision). */
export const createPageRevisionFrom = createMethod(
    pageActionSchema,
    async (config, fetchFn, params) => {
        const { id, fields } = params as CreatePageRevisionFromParams;
        const result = await executeWbOperation<WbPage>(config, fetchFn, {
            type: "mutation",
            operation: "createPageRevisionFrom",
            variableDefinitions: "$id: ID!",
            args: "id: $id",
            selection: buildFieldsSelection(fields),
            variables: { id },
            fields
        });
        return result.isFail() ? Result.fail(result.error) : Result.ok(result.value.data);
    }
);
