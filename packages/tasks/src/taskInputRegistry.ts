import { TaskInput } from "./taskInput";
import { TaskDefinition } from "~/tasks/task";

class TaskInputRegistry {
    private availableTypes: string[] = [];

    public constructor(definitions: TaskDefinition[] = []) {
        for (const definition of definitions) {
            if (this.availableTypes.includes(definition.type)) {
                throw new Error(`Task "${definition.type}" is already registered.`);
            }
            this.availableTypes.push(definition.type);
        }
    }

    public async register<T = any>(params: TaskInput<T> | TaskInput<T>[]): Promise<void> {
        const inputs = Array.isArray(params) ? params : [params];
        const tasks: TaskInput<any>[] = [];
        for (const input of inputs) {
            if (this.availableTypes.includes(input.type) === false) {
                throw new Error(`Task "${input.type}" does not a definition registered.`);
            }
            tasks.push(input);
        }
        await this.storageOperations.createTasks(tasks);
    }
}

export type { TaskInputRegistry };

export const createTaskInputRegistry = () => {
    return new TaskInputRegistry();
};
