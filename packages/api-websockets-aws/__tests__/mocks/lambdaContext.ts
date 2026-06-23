import type { Context as LambdaContext } from "@webiny/aws-sdk/types";

export const createMockLambdaContext = () => {
    return {} as LambdaContext;
};
