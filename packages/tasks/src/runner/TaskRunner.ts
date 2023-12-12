import { Context as LambdaContext } from "aws-lambda/handler";
import { Reply, Request } from "@webiny/handler/types";
import { ITaskEvent } from "~/handler/types";
import { ITaskRunner } from "./abstractions";
import { Context } from "~/types";
import { Response } from "~/response";
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
        validation: TaskEventValidation = new TaskEventValidation()
    ) {
        this.request = request;
        this.reply = reply;
        this.context = context;
        this.event = event;
        this.lambdaContext = lambdaContext;
        this.validation = validation;
    }

    public isCloseToTimeout() {
        return (
            this.lambdaContext.getRemainingTimeInMillis() <
            transformMinutesIntoMilliseconds(this.getIsCloseToTimeoutMinutes())
        );
    }

    public getRemainingTime() {
        return this.lambdaContext.getRemainingTimeInMillis();
    }

    public async run() {
        const response = new Response(this.event);

        let result: ITaskEvent;
        try {
            result = this.validation.validate(this.event);
        } catch (ex) {
            return response.error({
                error: ex
            });
        }

        const control = new TaskControl(this, response, this.context);

        try {
            return await control.run(result);
        } catch (ex) {
            return response.error({
                error: ex
            });
        }
    }

    private getIsCloseToTimeoutMinutes() {
        const value = parseInt(process.env["WEBINY_TASKS_TIMEOUT_CLOSE_MINUTES"] || "");
        return value > 0 ? value : DEFAULT_TASKS_TIMEOUT_CLOSE_MINUTES;
    }
}
