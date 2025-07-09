import type {
    InvocationType,
    InvokeCommandInput,
    InvokeCommandOutput,
    LambdaClient,
    LambdaClientConfig
} from "@webiny/aws-sdk/client-lambda/index.js";
import { InvokeCommand } from "@webiny/aws-sdk/client-lambda/index.js";
import { convertException } from "@webiny/utils/exception.js";

export interface IInvokeLambdaTriggerParamsCreateLambdaClientCb {
    (config: LambdaClientConfig): Pick<LambdaClient, "send">;
}

export interface IInvokeLambdaTriggerParams {
    createLambdaClient: IInvokeLambdaTriggerParamsCreateLambdaClientCb;
    arn: string;
}

export interface IInvokeLambdaHandleParams<TPayload> {
    payload: TPayload;
    invocationType: InvocationType;
}

export class LambdaTrigger<TPayload> {
    private readonly createLambdaClient: IInvokeLambdaTriggerParamsCreateLambdaClientCb;
    private readonly arn: string;

    public constructor(params: IInvokeLambdaTriggerParams) {
        this.createLambdaClient = params.createLambdaClient;
        this.arn = params.arn;
    }

    public async handle(params: IInvokeLambdaHandleParams<TPayload>): Promise<InvokeCommandOutput> {
        const lambdaClient = this.createLambdaClient({
            region: process.env.AWS_REGION
        });
        const { payload, invocationType } = params;

        const input: InvokeCommandInput = {
            FunctionName: this.arn,
            InvocationType: invocationType,
            Payload: Buffer.from(JSON.stringify(payload))
        };

        const cmd = new InvokeCommand(input);
        try {
            return await lambdaClient.send(cmd);
        } catch (ex) {
            console.error(`Error while invoking Lambda function: ${this.arn}.`);
            console.log(convertException(ex));
            throw ex;
        }
    }
}
