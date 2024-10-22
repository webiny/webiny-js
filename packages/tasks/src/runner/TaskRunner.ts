import { ITaskEvent, ITaskRawEvent } from "~/handler/types";
import { ITaskEventValidation, ITaskRunner } from "./abstractions";
import { Context } from "~/types";
import { Response, ResponseErrorResult } from "~/response";
import { TaskControl } from "./TaskControl";
import { IResponseResult } from "~/response/abstractions";
import { getErrorProperties } from "~/utils/getErrorProperties";
import { ITimer } from "@webiny/handler-aws/utils";

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
    public readonly timer: ITimer;
    private readonly validation: ITaskEventValidation;

    /**
     * We take all required variables separately because they will get injected via DI - so less refactoring is required in the future.
     */
    public constructor(context: C, timer: ITimer, validation: ITaskEventValidation) {
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

        /**
         * Here we set the context locale, using the value receive from the event.
         */
        this.setLocale(event);

        const control = new TaskControl(this, response, this.context);

        try {
            const result = await control.run(event);
            if (result instanceof ResponseErrorResult === false) {
                return result;
            }
            console.error(result);
            return result;
        } catch (ex) {
            console.error(`Failed to execute task "${event.webinyTaskId}".`);
            console.error(ex);
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

    private setLocale(event: ITaskEvent) {
        const { locale: localeCode } = event;
        const locale = this.context.i18n.getLocale(localeCode);

        if (!locale) {
            return;
        }

        this.context.i18n.setContentLocale(locale);
    }
}
