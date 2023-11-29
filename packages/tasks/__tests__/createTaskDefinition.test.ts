import { createTaskDefinition, ITask, TaskDefinition } from "~/task";
import { Context } from "./types";
import { TaskResponseStatus } from "~/types";

interface Input {
    test: boolean;
    file: string;
}

class MockTaskHandler implements ITask<Context, Input> {
    public async run() {
        return {
            status: TaskResponseStatus.DONE
        };
    }
    public async onSuccess() {}
}

describe("create task definition", () => {
    it("should create a task definition", async () => {
        const definition = createTaskDefinition<Context, Input>("aMockTaskType", async params => {
            return new MockTaskHandler();
        });

        expect(definition).toBeInstanceOf(TaskDefinition<Context, Input>);
        expect(definition.name).toEqual("task.definition.aMockTaskType");
        expect(definition.taskType).toEqual("aMockTaskType");
        expect(definition.handler).toBeInstanceOf(Function);
    });
});
