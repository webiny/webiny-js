import WebinyError from "@webiny/error";
import { Context as LambdaContext } from "aws-lambda/handler";
import { Reply, Request } from "@webiny/handler/types";
import { ITaskEvent } from "~/handler/types";
import { ITaskRunner } from "./types";
import { Context, IResponseManager } from "~/types";
import { MessageResponseManager } from "~/manager/MessageResponseManager";
import { TaskControl } from "~/control";
import { TaskEventValidation } from "./TaskEventValidation";

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
    public readonly request: Request;
    public readonly reply: Reply;
    public readonly context: C;
    public readonly event: ITaskEvent;
    public readonly lambdaContext: LambdaContext;

    private readonly response: IResponseManager;
    private readonly validation: TaskEventValidation;

    /**
     * We take all required variables separately because they will get injected via DI - so less refactoring is required in the future.
     */
    public constructor(
        event: ITaskEvent,
        lambdaContext: LambdaContext,
        request: Request,
        reply: Reply,
        context: C,
        response: IResponseManager = new MessageResponseManager(),
        validation: TaskEventValidation = new TaskEventValidation()
    ) {
        this.request = request;
        this.reply = reply;
        this.context = context;
        this.event = event;
        this.lambdaContext = lambdaContext;
        this.response = response;
        this.validation = validation;
    }

    public isTimeoutClose() {
        return (
            this.lambdaContext.getRemainingTimeInMillis() <
            transformMinutesIntoMilliseconds(this.getIsTimeoutCloseMinutes())
        );
    }

    public async run() {
        const result = this.validation.validate(this.event);
        if (result instanceof WebinyError) {
            return this.response.error({
                task: {
                    id: this.event.webinyTaskId || "unknown"
                },
                error: {
                    message: result.message,
                    code: "TASK_EVENT_VALIDATION_FAILED",
                    data: result.data
                },

                input: {}
            });
        }

        const control = new TaskControl(this, this.response, this.context);

        try {
            return await control.run(this.event);
        } catch (ex) {
            return this.response.error({
                task: {
                    id: this.event.webinyTaskId || "unknown"
                },
                input: {},
                error: ex
            });
        }
    }

    private getIsTimeoutCloseMinutes() {
        const value = parseInt(process.env["WEBINY_TASKS_TIMEOUT_CLOSE_MINUTES"] || "");
        return value > 0 ? value : DEFAULT_TASKS_TIMEOUT_CLOSE_MINUTES;
    }
}
