import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { normalizeSelfCleanup } from "~/api/utils/normalizeSelfCleanup.js";

/**
 * The metadata half of self-cleanup: a task that deletes itself has nowhere to keep logs, so asking
 * for any cleanup event forces `databaseLogs` off.
 *
 * The cleanup itself lives in {@link SelfCleaningTaskHandlerDecorator}, because it runs in the
 * lifecycle hooks and those belong to the handler.
 */
export class SelfCleaningTaskDefinitionDecoratorImpl implements TaskDefinition.Interface {
    private readonly cleansUp: boolean;

    public constructor(private decoratee: TaskDefinition.Interface) {
        this.cleansUp = normalizeSelfCleanup(decoratee.selfCleanup).size > 0;
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

    get isPrivate() {
        return this.decoratee.isPrivate;
    }

    get maxIterations() {
        return this.decoratee.maxIterations;
    }

    get selfCleanup() {
        return this.decoratee.selfCleanup;
    }

    get databaseLogs() {
        if (this.cleansUp) {
            return false;
        }
        return this.decoratee.databaseLogs;
    }
}

export const SelfCleaningTaskDefinitionDecorator = TaskDefinition.createDecorator({
    decorator: SelfCleaningTaskDefinitionDecoratorImpl,
    dependencies: []
});
