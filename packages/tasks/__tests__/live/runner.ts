import type { CreateLiveContextParams } from "./context";
import { createLiveContext } from "./context";
import { TaskRunner } from "~/runner";
import type { Context as LambdaContext } from "@webiny/aws-sdk/types";
import type { Context } from "~tests/types";
import { TaskEventValidation } from "~/runner/TaskEventValidation";
import { timerFactory } from "@webiny/handler-aws";

const defaultLambdaContext: Pick<LambdaContext, "getRemainingTimeInMillis"> = {
    getRemainingTimeInMillis: () => {
        return 1000000;
    }
};

export interface CreateLiveRunnerParams<C extends Context = Context>
    extends CreateLiveContextParams<C> {
    lambdaContext?: Pick<LambdaContext, "getRemainingTimeInMillis">;
    context?: C;
}

export const createLiveRunner = async <C extends Context = Context>(
    params?: CreateLiveRunnerParams<C>
) => {
    const context = params?.context || (await createLiveContext<C>(params));

    const runner = new TaskRunner(
        context,
        timerFactory(params?.lambdaContext || defaultLambdaContext),
        new TaskEventValidation()
    );

    return { runner, context };
};

export const createLiveRunnerFactory = <C extends Context = Context>(
    params?: CreateLiveRunnerParams<C>
) => {
    return () => {
        return createLiveRunner<C>(params);
    };
};
