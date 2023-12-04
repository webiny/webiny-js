import { createResponseManager } from "~/manager";
import { Context } from "~/types";
import { createTask } from "~/task/definition";

describe("create task manager", () => {
    const context = {
        context: true
    } as unknown as Context;
    const task = createTask<Context, any>({
        id: "myCustomTask",
        name: "A custom task defined via method",
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
        }
    });

    it("should create a task manager", async () => {
        const manager = createTaskManagerResponse(context, task);

        expect(manager).toBeDefined();
        expect(manager.context).toEqual({
            context: true
        });
        expect(manager.task).toMatchObject({
            id: "myCustomTask",
            name: "A custom task defined via method"
        });
    });
});
