import { Context as LambdaContext } from "aws-lambda/handler";

export const createMockLambdaContext = () => {
    return {} as LambdaContext;
};
