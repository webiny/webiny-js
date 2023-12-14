import { Context, ITaskDefinition } from "~/types";
import { createTaskDefinition } from "~/task";

export const MOCK_TASK_DEFINITION_ID = "myCustomTaskDefinition";

export const createMockTaskDefinition = (
    definition?: Partial<ITaskDefinition>
): ITaskDefinition => {
    return createTaskDefinition<Context, any>({
        id: MOCK_TASK_DEFINITION_ID,
        name: "A custom task defined via method",
        run: async ({ response, isCloseToTimeout, values }) => {
            try {
                if (isCloseToTimeout()) {
                    return response.continue({
                        values
                    });
                }
                return response.done();
            } catch (ex) {
                return response.error(ex);
            }
        },
        ...definition
    });
};
