import type { ITaskEvent, ITaskRawEvent } from "~/api/handler/types.js";
import type { ITaskEventValidation, ITaskRunner } from "./abstractions/index.js";
import type { Context } from "~/api/types.js";
import { Response, ResponseErrorResult } from "~/api/response/index.js";
import { TaskControl } from "./TaskControl.js";
import type { IResponseResult } from "~/api/response/abstractions/index.js";
import { getErrorProperties } from "~/api/utils/getErrorProperties.js";
import type { Timer } from "~/api/abstractions/Timer.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { TaskController } from "@webiny/api-core/features/task/TaskController/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { TaskExecutionContext } from "~/api/features/TaskExecutionContext/index.js";
import { TasksCrud } from "~/api/TasksCrud.js";
import { GetRunnableTaskDefinitionUseCase } from "~/api/features/GetRunnableTaskDefinition/abstractions.js";
import type { ITaskControlDependencies } from "./TaskControl.js";

const transformMinutesIntoMilliseconds = (minutes: number) => {
    return minutes * 60000;
};

const DEFAULT_TASKS_TIMEOUT_CLOSE_MINUTES = 3;

export class TaskRunner<C extends Context = Context> implements ITaskRunner<C> {
    /**
     * When DI is introduced, these will get injected.
     *
     * container.bind<Request>("Request").toConstantValue(request);
     * @inject("Request") public readonly request: Request;
     *
     * Follow the same example for the rest of the properties.
     */
    public readonly context: C;
    public readonly timer: Timer.Interface;
    private readonly validation: ITaskEventValidation;

    /**
     * We take all required variables separately because they will get injected via DI - so less refactoring is required in the future.
     */
    public constructor(context: C, timer: Timer.Interface, validation: ITaskEventValidation) {
        this.context = context;
        this.timer = timer;
        this.validation = validation;
    }

    public isCloseToTimeout(seconds?: number) {
        const milliseconds = seconds ? seconds * 1000 : this.getIsCloseToTimeoutMilliseconds();
        return this.timer.getRemainingMilliseconds() < milliseconds;
    }

    public async run(rawEvent: ITaskRawEvent): Promise<IResponseResult> {
        const response = new Response({
            ...rawEvent
        });

        let event: ITaskEvent;
        try {
            event = this.validation.validate(rawEvent);
        } catch (ex) {
            return response.error({
                error: getErrorProperties(ex)
            });
        }
        response.setEvent(event);
        /**
         * If we received a delay when initiating the task, we need to send the continue response immediately.
         */
        if (rawEvent.delay && rawEvent.delay > 0) {
            return response.continue({
                input: {},
                wait: rawEvent.delay
            });
        }

        // Resolved here, where the control's collaborators are assembled. TaskControl is built
        // by hand rather than by DI, so this is the one place that knows how to satisfy it; doing
        // it inside TaskControl's methods instead would leave the class with dependencies nothing
        // reading its signature can see, and nothing in a test can substitute.
        const container = this.context.container;
        const deps: ITaskControlDependencies = {
            logger: container.resolve(Logger),
            identityContext: container.resolve(IdentityContext),
            taskExecutionContext: container.resolve(TaskExecutionContext),
            tasksCrud: container.resolve(TasksCrud),
            taskController: container.resolve(TaskController),
            getRunnableTaskDefinition: container.resolve(GetRunnableTaskDefinitionUseCase)
        };
        const logger = deps.logger;
        const control = new TaskControl(this, response, this.context, deps);

        try {
            const result = await control.run(event);
            if (result instanceof ResponseErrorResult === false) {
                return result;
            }
            logger.error({ taskId: event.webinyTaskId, result }, "Task returned an error result.");
            return result;
        } catch (ex) {
            logger.error(
                { error: getErrorProperties(ex), taskId: event.webinyTaskId },
                "Failed to execute task."
            );
            return response.error({
                error: getErrorProperties(ex)
            });
        }
    }

    private getIsCloseToTimeoutMilliseconds() {
        const value = parseInt(process.env["WEBINY_TASKS_TIMEOUT_CLOSE_MINUTES"] || "");
        const result = value > 0 ? value : DEFAULT_TASKS_TIMEOUT_CLOSE_MINUTES;
        return transformMinutesIntoMilliseconds(result);
    }
}
