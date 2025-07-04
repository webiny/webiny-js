import { type IInvokeLambdaTriggerParams, LambdaTrigger } from "~/resolver/lambda/LambdaTrigger.js";

export const createLambdaTriggerMock = (params?: Partial<IInvokeLambdaTriggerParams>) => {
    return new LambdaTrigger({
        arn: "defaultArn",
        createLambdaClient: () => {
            return {
                send: async () => {
                    return {};
                }
            };
        },
        ...params
    });
};
