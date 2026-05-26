import { createTaskDefinition } from "~tests/helpers/createTaskDefinition";

export const MOCK_TASK_DEFINITION_ID = "myCustomTaskDefinition";

export const createMockTaskDefinitions = () => {
    return [
        createTaskDefinition({
            id: "myCustomTaskNumber1",
            title: "A custom task defined via method #1",
            description: "This is a description of the task #1",
            run({ controller }) {
                return controller.response.done("successfully ran the task #1", {
                    task: "#1"
                });
            }
        }),
        createTaskDefinition({
            id: "myCustomTaskNumber2",
            title: "A custom task defined via method #2",
            description: "This is a description of the task #2",
            run({ controller }) {
                return controller.response.done("successfully ran the task #2", {
                    task: "#2"
                });
            }
        }),
        createTaskDefinition({
            id: "myCustomTaskNumber3",
            title: "A custom task defined via method #3",
            description: "This is a description of the task #3",
            run({ controller }) {
                return controller.response.done("successfully ran the task #3", {
                    task: "#3"
                });
            }
        })
    ];
};
