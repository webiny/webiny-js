import { Context } from "./types";
import { ITask, ITaskParams } from "~/types";

interface MyInput {
    test: boolean;
    file: string;
}

class MyTask implements ITask<Context, MyInput> {
    public async run(params: ITaskParams<Context, MyInput>) {
        return params.manager.done();
    }
    public async onSuccess() {}
}

describe("create task", () => {
    it("should properly create a task - object", async () => {
        const task: ITask<Context, MyInput> = {
            run: async ({ manager, input }) => {
                if (manager.isTimeoutClose()) {
                    return manager.continue({
                        input
                    });
                }
                return manager.done();
            },
            onSuccess: async () => {}
        };

        expect(task.run).toBeInstanceOf(Function);
        expect(task.onSuccess).toBeInstanceOf(Function);
    });

    it("should properly create a task - clas", async () => {
        const task = new MyTask();

        expect(task.run).toBeInstanceOf(Function);
        expect(task.onSuccess).toBeInstanceOf(Function);
    });
});
