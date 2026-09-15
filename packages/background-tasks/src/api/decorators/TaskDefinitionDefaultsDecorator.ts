import camelCase from "lodash/camelCase.js";
import WebinyError from "@webiny/error";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";

const DEFAULT_MAX_ITERATIONS = 50;

/**
 * Fills in the defaults a definition is allowed to leave out, and rejects an id that is not
 * camelCase.
 *
 * Everything here is metadata. A definition carries no behaviour, so there is nothing to forward:
 * `GetTaskDefinitionUseCase` takes `run` and the hooks from the handler that `handler` names, after
 * this decorator has run.
 */
class TaskDefinitionDefaultsDecoratorImpl implements TaskDefinition.Interface {
    constructor(private decoratee: TaskDefinition.Interface) {
        this.validate();
    }

    get id() {
        return this.decoratee.id;
    }

    get title() {
        return this.decoratee.title;
    }

    get description() {
        return this.decoratee.description;
    }

    get handler() {
        return this.decoratee.handler;
    }

    // The three defaults.
    get isPrivate() {
        return this.decoratee.isPrivate || false;
    }

    get databaseLogs() {
        return this.decoratee.databaseLogs || false;
    }

    get maxIterations() {
        return this.decoratee.maxIterations || DEFAULT_MAX_ITERATIONS;
    }

    get selfCleanup() {
        return this.decoratee.selfCleanup;
    }

    private validate(): void {
        if (camelCase(this.decoratee.id) !== this.decoratee.id) {
            throw new WebinyError(
                `Task ID "${this.decoratee.id}" is invalid. It must be in camelCase format, for example: "myCustomTask".`
            );
        }
    }
}

export const TaskDefinitionDefaultsDecorator = TaskDefinition.createDecorator({
    decorator: TaskDefinitionDefaultsDecoratorImpl,
    dependencies: []
});
