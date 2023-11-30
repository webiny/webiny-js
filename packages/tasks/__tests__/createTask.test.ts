import { Context } from "./types";
import { ITask, ITaskParams } from "~/types";
import { createTask } from "~/task";

interface MyInput {
    test: boolean;
    file: string;
}

class MyTask implements ITask<Context, MyInput> {
    public name: string = "myCustomTask";
    public async run(params: ITaskParams<Context, MyInput>) {
        return params.manager.done();
    }
    public async onSuccess() {}
}

describe("create task", () => {
    it("should properly create a task - object", async () => {
        const task: ITask<Context, MyInput> = {
            name: "myCustomTask",
            run: async ({ manager, input }) => {
                try {
                    if (manager.isTimeoutClose()) {
                        return manager.continue({
                            input
                        });
                    }
                    return manager.done();
                } catch (ex) {
                    return manager.error(ex);
                }
            },
            onSuccess: async () => {}
        };

        expect(task.run).toBeInstanceOf(Function);
        expect(task.onSuccess).toBeInstanceOf(Function);
    });

    it("should properly create a task - via method", async () => {
        const task = createTask<Context, MyTask>({
            name: "myCustomTask",
            run: async ({ manager, input }) => {
                try {
                    if (manager.isTimeoutClose()) {
                        return manager.continue({
                            input
                        });
                    }
                    return manager.done();
                } catch (ex) {
                    return manager.error(ex);
                }
            },
            onSuccess: async params => {}
        });

        expect(task.run).toBeInstanceOf(Function);
        expect(task.onSuccess).toBeInstanceOf(Function);
    });

    it("should properly create a task - class", async () => {
        const task = new MyTask();

        expect(task.run).toBeInstanceOf(Function);
        expect(task.onSuccess).toBeInstanceOf(Function);
    });
});
