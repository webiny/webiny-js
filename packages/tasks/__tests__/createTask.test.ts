import { Context } from "./types";
import { ITaskDefinition, ITaskRunParams } from "~/types";
import { createTask } from "~/task/definition";

interface MyInput {
    test: boolean;
    file: string;
}

class MyTask implements ITaskDefinition<Context, MyInput> {
    public readonly id = "myCustomTask";
    public readonly name = "A custom task defined via object";
    public async run(params: ITaskRunParams<Context, MyInput>) {
        return params.response.done();
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
            }
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
