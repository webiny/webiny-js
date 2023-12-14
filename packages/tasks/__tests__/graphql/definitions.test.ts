import { useGraphQLHandler } from "~tests/helpers/useGraphQLHandler";
import { createTaskDefinition } from "~/task";

describe("graphql - definitions", () => {
    const handler = useGraphQLHandler({
        plugins: [
            createTaskDefinition({
                id: "myCustomTask-1",
                title: "A custom task defined via method #1",
                description: "This is a description of the task #1",
                async run({ response }) {
                    return response.done("successfully ran the task #1");
                }
            }),
            createTaskDefinition({
                id: "myCustomTask-2",
                title: "A custom task defined via method #2",
                description: "This is a description of the task #2",
                async run({ response }) {
                    return response.done("successfully ran the task #2");
                }
            }),
            createTaskDefinition({
                id: "myCustomTask-3",
                title: "A custom task defined via method #3",
                description: "This is a description of the task #3",
                async run({ response }) {
                    return response.done("successfully ran the task #3");
                },
                config: task => {
                    task.addField({
                        type: "text",
                        label: "Some Field",
                        fieldId: "someField"
                    });
                }
            })
        ]
    });

    it("should list available task definitions", async () => {
        const result = await handler.listDefinitions();

        expect(result).toEqual({
            data: {
                backgroundTasks: {
                    listDefinitions: {
                        data: [
                            {
                                id: "myCustomTask-1",
                                title: "A custom task defined via method #1",
                                description: "This is a description of the task #1",
                                fields: []
                            },
                            {
                                id: "myCustomTask-2",
                                title: "A custom task defined via method #2",
                                description: "This is a description of the task #2",
                                fields: []
                            },
                            {
                                id: "myCustomTask-3",
                                title: "A custom task defined via method #3",
                                description: "This is a description of the task #3",
                                fields: [
                                    {
                                        fieldId: "someField",
                                        label: "Some Field",
                                        type: "text"
                                    }
                                ]
                            }
                        ],
                        error: null
                    }
                }
            }
        });
    });
});
