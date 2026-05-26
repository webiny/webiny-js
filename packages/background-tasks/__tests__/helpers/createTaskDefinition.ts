import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { createContextPlugin } from "@webiny/api";
import type { ISelfCleanup } from "@webiny/api-core/features/task/TaskDefinition/index.js";

interface TaskParams<T> {
    id: string;
    title: string;
    description?: string;
    selfCleanup?: ISelfCleanup;
    databaseLogs?: boolean;
    run: (params: TaskDefinition.RunParams) => T;
    createInputValidation?: TaskDefinition.Interface["createInputValidation"];
    onDone?: TaskDefinition.Interface["onDone"];
    onError?: TaskDefinition.Interface["onError"];
    onAbort?: TaskDefinition.Interface["onAbort"];
}

export function createTaskDefinition<T extends TaskDefinition.Result>(params: TaskParams<T>) {
    class TestingRunTask implements TaskDefinition.Interface {
        id = params.id;
        title = params.title;
        description = params.description;
        selfCleanup = params.selfCleanup;
        databaseLogs = params.databaseLogs;

        async run({ input, controller }: TaskDefinition.RunParams) {
            return params.run({ input, controller });
        }

        createInputValidation({ validator }: TaskDefinition.CreateInputValidationParams) {
            if (params.createInputValidation) {
                return params.createInputValidation({ validator });
            }
            return {};
        }

        onDone = params.onDone;
        onError = params.onError;
        onAbort = params.onAbort;
    }

    const TestTaskDefinition = TaskDefinition.createImplementation({
        implementation: TestingRunTask,
        dependencies: []
    });

    return createContextPlugin(context => {
        context.container.register(TestTaskDefinition);
    });
}
