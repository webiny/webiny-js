import camelCase from "lodash/camelCase.js";
import WebinyError from "@webiny/error";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import type { ITaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";

const DEFAULT_MAX_ITERATIONS = 50;

/**
 * RunnableTaskDecorator adds runtime behavior to TaskDefinition:
 * - Applies default values (maxIterations, isPrivate, enableDatabaseLogs, fields)
 * - Validates task ID (must be camelCase)
 * - Provides field management methods
 */
class RunnableTaskDecoratorImpl implements TaskDefinition.Interface {
    constructor(private decoratee: TaskDefinition.Interface) {
        this.validate();
    }

    // Delegate simple properties
    get id() {
        return this.decoratee.id;
    }

    get title() {
        return this.decoratee.title;
    }

    get description() {
        return this.decoratee.description;
    }

    // Apply default values
    get isPrivate() {
        return this.decoratee.isPrivate ?? false;
    }

    get enableDatabaseLogs() {
        return this.decoratee.enableDatabaseLogs ?? false;
    }

    get maxIterations() {
        return this.decoratee.maxIterations || DEFAULT_MAX_ITERATIONS;
    }

    get createInputValidation() {
        return this.decoratee.createInputValidation;
    }

    // Delegate lifecycle methods (bind to preserve context)
    get run() {
        return this.decoratee.run.bind(this.decoratee);
    }

    get onBeforeTrigger() {
        return this.decoratee.onBeforeTrigger?.bind(this.decoratee);
    }

    get onDone() {
        return this.decoratee.onDone?.bind(this.decoratee);
    }

    get onError() {
        return this.decoratee.onError?.bind(this.decoratee);
    }

    get onAbort() {
        return this.decoratee.onAbort?.bind(this.decoratee);
    }

    get onMaxIterations() {
        return this.decoratee.onMaxIterations?.bind(this.decoratee);
    }

    // Validation logic
    private validate(): void {
        if (camelCase(this.decoratee.id) !== this.decoratee.id) {
            const message = `Task ID "${this.decoratee.id}" is invalid. It must be in camelCase format, for example: "myCustomTask".`;
            console.log(message);
            throw new WebinyError(message);
        }
    }

    // Method to get the underlying task (for compatibility with existing code)
    public getTask(): ITaskDefinition {
        return this;
    }
}

export const RunnableTaskDecorator = TaskDefinition.createDecorator({
    decorator: RunnableTaskDecoratorImpl,
    dependencies: []
});
