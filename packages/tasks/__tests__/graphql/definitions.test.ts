import { useGraphQLHandler } from "~tests/helpers/useGraphQLHandler";
import { createMockTaskDefinitions } from "~tests/mocks/definition";

describe("graphql - definitions", () => {
    const handler = useGraphQLHandler({
        plugins: [...createMockTaskDefinitions()]
    });

    it("should list available task definitions", async () => {
        const result = await handler.listDefinitions();

        expect(result).toEqual({
            data: {
                backgroundTasks: {
                    listDefinitions: {
                        data: [
                            {
                                id: "myCustomTaskNumber1",
                                title: "A custom task defined via method #1",
                                description: "This is a description of the task #1",
                                fields: []
                            },
                            {
                                id: "myCustomTaskNumber2",
                                title: "A custom task defined via method #2",
                                description: "This is a description of the task #2",
                                fields: []
                            },
                            {
                                id: "myCustomTaskNumber3",
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
