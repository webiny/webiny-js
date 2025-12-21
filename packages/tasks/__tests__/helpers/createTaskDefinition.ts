import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { createContextPlugin } from "@webiny/api";

interface TaskParams<T> {
    id: string;
    title: string;
    description?: string;
    run: (params: TaskDefinition.RunParams) => T;
    createInputValidation?: TaskDefinition.Interface["createInputValidation"];
}

export function createTaskDefinition<T extends TaskDefinition.Result>(params: TaskParams<T>) {
    class TestingRunTask implements TaskDefinition.Interface {
        id = params.id;
        title = params.title;
        description = params.description;

        async run({ input, controller }: TaskDefinition.RunParams) {
            return params.run({ input, controller });
        }

        createInputValidation({ validator }: TaskDefinition.CreateInputValidationParams) {
            if (params.createInputValidation) {
                return params.createInputValidation({ validator });
            }

            return {};
        }
    }

    const TestTaskDefinition = TaskDefinition.createImplementation({
        implementation: TestingRunTask,
        dependencies: []
    });

    return createContextPlugin(context => {
        context.container.register(TestTaskDefinition);
    });
}
