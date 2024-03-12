import { createLiveContext, CreateLiveContextParams } from "./context";
import { TaskRunner } from "~/runner";
import { Context as LambdaContext } from "aws-lambda/handler";
import { Context } from "~tests/types";

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

    const runner = new TaskRunner(params?.lambdaContext || defaultLambdaContext, context);

    return { runner, context };
};

export const createLiveRunnerFactory = <C extends Context = Context>(
    params?: CreateLiveRunnerParams<C>
) => {
    return () => {
        return createLiveRunner<C>(params);
    };
};
