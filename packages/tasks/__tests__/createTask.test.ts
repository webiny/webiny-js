import { Context } from "./types";
import { ITaskDefinition, ITaskField, ITaskRunParams } from "~/types";
import { createTask, createTaskField } from "~/task/definition";

const taskField: ITaskField = {
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
}

class MyTask implements ITaskDefinition<Context, MyInput> {
    public readonly id = "myCustomTask";
    public readonly name = "A custom task defined via object";

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

describe("create task", () => {
    it("should properly create a task - object", async () => {
        const task: ITaskDefinition<Context, MyInput> = {
            id: "myCustomTask",
            name: "A custom task defined via object",
            run: async ({ response, isTimeoutClose, input }) => {
                try {
                    if (isTimeoutClose()) {
                        return response.continue({
                            input
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
                createTaskField({
                    ...taskField
                })
            ]
        };

        expect(task.run).toBeInstanceOf(Function);
        expect(task.onDone).toBeInstanceOf(Function);
    });

    it("should properly create a task - via method", async () => {
        const task = createTask<Context, MyTask>({
            id: "myCustomTask",
            name: "A custom task defined via method",
            run: async ({ response, isTimeoutClose, input }) => {
                try {
                    if (isTimeoutClose()) {
                        return response.continue({
                            input
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
            fields: task => {
                task.addField({
                    ...taskField
                });
            }
        });

        expect(task.run).toBeInstanceOf(Function);
        expect(task.onDone).toBeInstanceOf(Function);
    });

    it("should properly create a task - class", async () => {
        const task = new MyTask();

        expect(task.run).toBeInstanceOf(Function);
        expect(task.onDone).toBeInstanceOf(Function);
    });
});
