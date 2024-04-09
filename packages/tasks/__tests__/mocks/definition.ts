import { Context, ITaskDefinition } from "~/types";
import { createTaskDefinition } from "~/task";

export const MOCK_TASK_DEFINITION_ID = "myCustomTaskDefinition";

export const createMockTaskDefinition = (definition?: Partial<ITaskDefinition>) => {
    return createTaskDefinition<Context, any>({
        id: MOCK_TASK_DEFINITION_ID,
        title: "A custom task defined via method",
        run: async ({ response, isCloseToTimeout, input }) => {
            try {
                if (isCloseToTimeout()) {
                    return response.continue({
                        ...input
                    });
                }
                return response.done("Task done!", {
                    withSomeBoolean: true,
                    withSomeNumber: 1,
                    withSomeString: "yes!",
                    withSomeObject: {
                        testingObject: "yes!"
                    }
                });
            } catch (ex) {
                return response.error(ex);
            }
        },
        ...definition
    });
};

export const createMockTaskDefinitions = () => {
    return [
        createTaskDefinition({
            id: "myCustomTaskNumber1",
            title: "A custom task defined via method #1",
            description: "This is a description of the task #1",
            async run({ response }) {
                return response.done("successfully ran the task #1", {
                    task: "#1"
                });
            }
        }),
        createTaskDefinition({
            id: "myCustomTaskNumber2",
            title: "A custom task defined via method #2",
            description: "This is a description of the task #2",
            async run({ response }) {
                return response.done("successfully ran the task #2", {
                    task: "#2"
                });
            }
        }),
        createTaskDefinition({
            id: "myCustomTaskNumber3",
            title: "A custom task defined via method #3",
            description: "This is a description of the task #3",
            async run({ response }) {
                return response.done("successfully ran the task #3", {
                    task: "#3"
                });
            },
            config: task => {
                task.addField({
                    type: "text",
                    label: "Some Field",
                    fieldId: "someField"
                });
            }
        })
    ];
};
