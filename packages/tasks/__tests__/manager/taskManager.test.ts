import { Context, ITaskDataStatus } from "~/types";
import { createTask } from "~/task/definition";
import { TaskManager } from "~/manager";
import {
    createMockContext,
    createMockEvent,
    createMockResponseFactory,
    createMockRunner
} from "~tests/mocks";

describe("create task manager", () => {
    const taskDefinition = createTask<Context, any>({
        id: "myCustomTask",
        name: "A custom task defined via method",
        run: async ({ response, isCloseToTimeout, input }) => {
            try {
                if (isCloseToTimeout()) {
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
        const factory = createMockResponseFactory();
        const manager = new TaskManager(
            createMockRunner(),
            createMockContext(),
            factory(createMockEvent()),
            {
                id: "myCustomTask",
                input: {},
                name: "A custom task defined via method",
                log: [],
                createdOn: new Date(),
                savedOn: new Date(),
                status: ITaskDataStatus.PENDING
            },
            taskDefinition
        );

        expect(manager).toBeDefined();
        expect(manager.run).toBeInstanceOf(Function);
    });
});
