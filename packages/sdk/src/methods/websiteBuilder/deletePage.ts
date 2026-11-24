import { Result } from "../../Result.js";
import { createMethod } from "../../utils/createMethod.js";
import { deletePageSchema } from "./schemas.js";
import { executeWbOperation } from "./executeWbOperation.js";

export interface DeletePageParams {
    id: string;
    /** `true` deletes it for good; by default it goes to the trash bin. */
    permanently?: boolean;
}

export const deletePage = createMethod(deletePageSchema, async (config, fetchFn, params) => {
    const { id, permanently } = params as DeletePageParams;
    const result = await executeWbOperation<boolean>(config, fetchFn, {
        type: "mutation",
        operation: "deletePage",
        variableDefinitions: "$id: ID!, $permanently: Boolean",
        args: "id: $id, permanently: $permanently",
        variables: { id, permanently }
    });
    return result.isFail() ? Result.fail(result.error) : Result.ok(result.value.data === true);
});
