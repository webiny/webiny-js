import WebinyError from "@webiny/error";
import { Context as LambdaContext } from "aws-lambda/handler";
import { Reply, Request } from "@webiny/handler/types";
import { ITaskEvent } from "~/handler/types";
import { ITaskRunner } from "./types";
import { Context, IResponseManager } from "~/types";
import { MessageResponseManager } from "~/manager/MessageResponseManager";
import { TaskControl } from "~/control";
import { TaskEventValidation } from "./TaskEventValidation";
// import { createResponseManager } from "~/manager/TaskManagerResponse";
// import { createTaskControl } from "~/control";

export interface ITaskRunnerParams<C extends Context = Context> {
    request: Request;
    reply: Reply;
    context: C;
    event: ITaskEvent;
    lambdaContext: LambdaContext;
}

const transformMinutesIntoMilliseconds = (minutes: number) => {
    return minutes * 60000;
};

export class TaskRunner<C extends Context = Context> implements ITaskRunner<C> {
    /**
     * When DI is introduced, these will be injected.
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

    public constructor(params: ITaskRunnerParams<C>) {
        this.request = params.request;
        this.reply = params.reply;
        this.context = params.context;
        this.event = params.event;
        this.lambdaContext = params.lambdaContext;
        /**
         * Instances will be injected at some point.
         */
        this.response = new MessageResponseManager();
        this.validation = new TaskEventValidation();
    }

    public isTimeoutClose() {
        return this.lambdaContext.getRemainingTimeInMillis() < transformMinutesIntoMilliseconds(5);
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

        const control = new TaskControl({
            runner: this,
            context: this.context,
            response: this.response
        });

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
}
