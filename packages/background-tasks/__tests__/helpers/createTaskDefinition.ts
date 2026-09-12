import {
    TaskDefinition,
    TaskHandler
} from "@webiny/api-core/features/task/TaskDefinition/index.js";
import type { Container } from "@webiny/di";
import type { ISelfCleanup } from "@webiny/api-core/features/task/TaskDefinition/index.js";

interface TaskParams<T> {
    id: string;
    title: string;
    description?: string;
    selfCleanup?: ISelfCleanup;
    databaseLogs?: boolean;
    run: (params: TaskHandler.RunParams) => T;
    createInputValidation?: TaskHandler.Interface["createInputValidation"];
    onDone?: TaskHandler.Interface["onDone"];
    onError?: TaskHandler.Interface["onError"];
    onAbort?: TaskHandler.Interface["onAbort"];
}

export function createTaskDefinition<T extends TaskDefinition.Result>(params: TaskParams<T>) {
    class TestingRunTaskHandler implements TaskHandler.Interface {
        async run({ input, controller }: TaskHandler.RunParams) {
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

    // The handler must go through `createImplementation`: `resolveImplementation` reads dependency
    // metadata off the class and throws "No abstraction metadata found" for a plain one.
    const TestTaskHandler = TaskHandler.createImplementation({
        implementation: TestingRunTaskHandler,
        dependencies: []
    });

    class TestingRunTask implements TaskDefinition.Interface {
        id = params.id;
        title = params.title;
        description = params.description;
        selfCleanup = params.selfCleanup;
        databaseLogs = params.databaseLogs;
        handler = TestTaskHandler;
    }

    const TestTaskDefinition = TaskDefinition.createImplementation({
        implementation: TestingRunTask,
        dependencies: []
    });

    return (container: Container) => {
        container.register(TestTaskDefinition);
    };
}
