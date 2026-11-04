import { describe, expect, it } from "vitest";
import { useGraphQLHandler } from "~tests/helpers/useGraphQLHandler";
import { useRawHandler } from "~tests/helpers/useRawHandler";
import { createTaskDefinition } from "~tests/helpers/createTaskDefinition";
import { createMockTaskDefinitions } from "~tests/mocks/definition";
import { GetTaskUseCase } from "~/api/features/GetTask/index.js";
import { CreateTaskUseCase } from "~/api/features/CreateTask/index.js";
import { CreateTaskLogUseCase } from "~/api/features/CreateTaskLog/index.js";
import { DeleteTaskUseCase } from "~/api/features/DeleteTask/index.js";
import { TaskNotFoundError } from "~/api/domain/errors.js";
import type { Context, ITaskLogCreateInput } from "~/api/types";
import { TaskDataStatus, type ITask } from "~/api/types";

const PRIVATE_ID = "privateTestingTask";
const PUBLIC_ID = "myCustomTaskNumber1";

interface INamedItem {
    name: string;
}

// The storage setup and checks of these tests, through the background tasks use cases.
const useTasks = (context: Context) => {
    const container = context.container;
    return {
        async createTask(params: CreateTaskUseCase.Params): Promise<ITask> {
            const result = await container.resolve(CreateTaskUseCase).execute(params);
            if (result.isFail()) {
                throw result.error;
            }
            return result.value;
        },
        async createLog(task: Pick<ITask, "id">, data: ITaskLogCreateInput): Promise<void> {
            const result = await container.resolve(CreateTaskLogUseCase).execute(task, data);
            if (result.isFail()) {
                throw result.error;
            }
        },
        async deleteTask(id: string): Promise<boolean> {
            const result = await container.resolve(DeleteTaskUseCase).execute(id);
            if (result.isFail()) {
                throw result.error;
            }
            return true;
        },
        async getTask(id: string): Promise<ITask | null> {
            const result = await container.resolve(GetTaskUseCase).execute(id);
            if (result.isOk()) {
                return result.value;
            }
            if (result.error instanceof TaskNotFoundError) {
                return null;
            }
            throw result.error;
        }
    };
};

const createPrivateTaskDefinition = () => {
    return createTaskDefinition({
        id: PRIVATE_ID,
        title: "A private task",
        isPrivate: true,
        databaseLogs: true,
        run({ controller }) {
            return controller.response.done("ran the private task");
        }
    });
};

// A private definition cannot be started from GraphQL (see triggerTaskPrivate.test.ts), but its
// runs are visible and managed like any other.
describe("graphql - private task runs are visible", () => {
    const plugins = [...createMockTaskDefinitions(), createPrivateTaskDefinition()];
    const handler = useGraphQLHandler({ plugins });
    const rawHandler = useRawHandler({ plugins });

    const createPrivateTask = async (context: Context, name = "Private run") => {
        return useTasks(context).createTask({ definitionId: PRIVATE_ID, name, input: {} });
    };

    it("returns a private task", async () => {
        const context = await rawHandler.handle();
        const privateTask = await createPrivateTask(context);

        const result = await handler.getTask({ id: privateTask.id });

        expect(result.data.backgroundTasks.getTask.error).toBeNull();
        expect(result.data.backgroundTasks.getTask.data).toMatchObject({
            id: privateTask.id,
            definitionId: PRIVATE_ID
        });
    });

    it("lists private tasks with the public ones", async () => {
        const context = await rawHandler.handle();
        await useTasks(context).createTask({ definitionId: PUBLIC_ID, name: "Public", input: {} });
        await createPrivateTask(context, "Private");

        const result = await handler.listTasks({});

        expect(result.data.backgroundTasks.listTasks.error).toBeNull();
        expect(
            result.data.backgroundTasks.listTasks.data.map((item: INamedItem) => item.name).sort()
        ).toEqual(["Private", "Public"]);
        expect(result.data.backgroundTasks.listTasks.meta.totalCount).toBe(2);
    });

    it("lists the logs of a private task", async () => {
        const context = await rawHandler.handle();
        const privateTask = await createPrivateTask(context);
        await useTasks(context).createLog(privateTask, {
            executionName: "privateExecution",
            iteration: 1
        });

        const result = await handler.listTaskLogsQuery({ where: { task: privateTask.id } });
        const list = result.data.backgroundTasks.listLogs;

        expect(list.error).toBeNull();
        expect(list.data).toHaveLength(1);
        expect(list.data[0]).toMatchObject({
            executionName: "privateExecution",
            task: { id: privateTask.id }
        });
    });

    it("aborts a private task", async () => {
        const context = await rawHandler.handle();
        const privateTask = await createPrivateTask(context);

        const result = await handler.abortTask({ id: privateTask.id });

        expect(result.data.backgroundTasks.abortTask.error).toBeNull();
        expect(result.data.backgroundTasks.abortTask.data).toMatchObject({
            id: privateTask.id,
            taskStatus: TaskDataStatus.ABORTED
        });
    });

    it("deletes a private task", async () => {
        const context = await rawHandler.handle();
        const privateTask = await createPrivateTask(context);

        const result = await handler.deleteTask({ id: privateTask.id });

        expect(result).toEqual({
            data: { backgroundTasks: { deleteTask: { data: true, error: null } } }
        });
        expect(await useTasks(context).getTask(privateTask.id)).toBeNull();
    });
});
