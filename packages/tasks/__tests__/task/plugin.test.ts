import WebinyError from "@webiny/error";
import { Context } from "../types";
import { ITaskDefinition, ITaskDefinitionField, ITaskRunParams } from "~/types";
import { createTaskDefinition, createTaskDefinitionField } from "~/task/plugin";
import { createMockTaskDefinition } from "~tests/mocks/definition";

const taskField: ITaskDefinitionField = {
    fieldId: "url",
    type: "text",
    label: "Url",
    helpText: "Enter a URL",
    validation: [
        {
            name: "required",
            message: "Url is required."
        },
        {
            name: "url",
            message: "Enter a valid URL."
        }
    ]
};

interface MyInput {
    test: boolean;
    file: string;
    page: number;
}

class MyTask implements ITaskDefinition<Context, MyInput> {
    public readonly id = "myCustomTask";
    public readonly title = "A custom task defined via class";
    public readonly maxIterations = 1;

    public fields = [
        {
            ...taskField
        }
    ];

    public async run({ response }: ITaskRunParams<Context, MyInput>) {
        return response.done();
    }
    public async onDone() {
        return;
    }
    public async onError() {
        return;
    }
}

describe("task plugin", () => {
    it("should properly create a task - plain object", async () => {
        const task: ITaskDefinition<Context, MyInput> = {
            id: "myCustomTask",
            title: "A custom task defined via object",
            maxIterations: 1,
            run: async ({ response, isCloseToTimeout, input }) => {
                try {
                    if (isCloseToTimeout()) {
                        return response.continue({
                            ...input,
                            page: input.page + 1
                        });
                    }

                    return response.done();
                } catch (ex) {
                    return response.error(ex);
                }
            },
            onDone: async () => {
                return;
            },
            onError: async () => {
                return;
            },
            fields: [
                createTaskDefinitionField({
                    ...taskField
                })
            ]
        };

        expect(task.id).toBe("myCustomTask");
        expect(task.title).toBe("A custom task defined via object");
        expect(task.fields).toHaveLength(1);
        expect(task.fields).toEqual([taskField]);
        expect(task.run).toBeInstanceOf(Function);
        expect(task.onDone).toBeInstanceOf(Function);
        expect(task.onError).toBeInstanceOf(Function);
    });

    it("should properly create a task - via method", async () => {
        const task = createTaskDefinition<Context, MyInput>({
            id: "myCustomTask",
            title: "A custom task defined via method",
            run: async ({ response, isCloseToTimeout, input }) => {
                try {
                    if (isCloseToTimeout()) {
                        return response.continue({
                            ...input
                        });
                    }
                    return response.done();
                } catch (ex) {
                    return response.error(ex);
                }
            },
            onDone: async () => {
                return;
            },
            onError: async () => {
                return;
            },
            onAbort: async () => {
                return;
            },
            config: task => {
                task.addField({
                    ...taskField
                });
            }
        });

        expect(task.id).toBe("myCustomTask");
        expect(task.title).toBe("A custom task defined via method");
        expect(task.fields).toHaveLength(1);
        expect(task.fields).toEqual([taskField]);
        expect(task.run).toBeInstanceOf(Function);
        expect(task.onDone).toBeInstanceOf(Function);
        expect(task.onError).toBeInstanceOf(Function);
    });

    it("should properly create a task - via class", async () => {
        const task = new MyTask();

        expect(task.id).toBe("myCustomTask");
        expect(task.title).toBe("A custom task defined via class");
        expect(task.fields).toHaveLength(1);
        expect(task.fields).toEqual([taskField]);
        expect(task.run).toBeInstanceOf(Function);
        expect(task.onDone).toBeInstanceOf(Function);
        expect(task.onError).toBeInstanceOf(Function);
    });

    it("should fail on invalid task id", async () => {
        let error: WebinyError | undefined;
        try {
            createMockTaskDefinition({
                id: "id-whichIsNotValid"
            });
        } catch (ex) {
            error = ex;
        }

        expect(error?.message).toEqual(
            `Task ID "id-whichIsNotValid" is invalid. It must be in camelCase format, for example: "myCustomTask".`
        );
    });
});
