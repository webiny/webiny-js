import { Context } from "~/types";
import { createTask } from "~/task/definition";
import { TaskManager } from "~/manager";
import { MessageResponseManager } from "~/manager/MessageResponseManager";

describe("create task manager", () => {
    const context = {
        context: true
    } as unknown as Context;
    const taskDefinition = createTask<Context, any>({
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
        }
    });

    it("should create a task manager", async () => {
        const manager = new TaskManager({
            context,
            task: {
                id: "myCustomTask",
                input: {},
                name: "A custom task defined via method",
                log: {},
                createdOn: new Date(),
                savedOn: new Date(),
                status: "pending"
            },
            definition: taskDefinition,
            response: new MessageResponseManager(),
            runner: {
                isTimeoutClose: () => {
                    return false;
                }
            }
        });

        expect(manager).toBeDefined();
        expect(manager.isTimeoutClose).toBeInstanceOf(Function);
        expect(manager.run).toBeInstanceOf(Function);
    });
});
