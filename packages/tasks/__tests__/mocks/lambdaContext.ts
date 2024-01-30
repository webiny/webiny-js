import { Context as LambdaContext } from "aws-lambda/handler";

export interface MockLambdaContextParams {
    remainingTimeInMillis?: number;
}

export const createMockLambdaContext = (options?: MockLambdaContextParams): LambdaContext => {
    return {
        getRemainingTimeInMillis: () => {
            return options?.remainingTimeInMillis || 600000;
        }
    } as LambdaContext;
};
