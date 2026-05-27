import type {
    ITaskService,
    ITaskServiceCreatePluginParams,
    ITaskServiceTask
} from "~/api/plugins/index.js";
import { TaskServicePlugin } from "~/api/plugins/index.js";
import type { DescribeExecutionCommandOutput } from "@webiny/aws-sdk/client-sfn/index.js";
import {
    createStepFunctionClient,
    describeExecutionFactory,
    triggerStepFunctionFactory
} from "@webiny/aws-sdk/client-sfn/index.js";
import type { ITaskEventInput } from "~/api/handler/types.js";
import { generateAlphaNumericId } from "@webiny/utils";
import { ServiceDiscovery } from "@webiny/api";
import type { ITask } from "~/api/types.js";

export type IStepFunctionServiceFetchResult = DescribeExecutionCommandOutput;

export interface IDetailWrapper<T> {
    detail: T;
}

export class StepFunctionService implements ITaskService {
    private readonly getTenant: () => string;
    private readonly trigger: ReturnType<typeof triggerStepFunctionFactory>;
    private readonly get: ReturnType<typeof describeExecutionFactory>;

    public constructor(params: ITaskServiceCreatePluginParams) {
        this.getTenant = params.getTenant;
        const client = createStepFunctionClient();
        this.trigger = triggerStepFunctionFactory(client);
        this.get = describeExecutionFactory(client);
    }
    public async send(task: ITaskServiceTask, delay: number) {
        const manifest = await ServiceDiscovery.load();
        if (!manifest) {
            console.error("Service manifest not found.");
            return null;
        }
        const { bgTaskSfn } = manifest.api || {};
        if (!bgTaskSfn) {
            console.error("Background task state machine not found.");
            return null;
        }

        const input: ITaskEventInput = {
            webinyTaskId: task.id,
            webinyTaskDefinitionId: task.definitionId,
            tenant: this.getTenant(),
            delay
        };
        const name = `${task.definitionId}_${task.id}_${generateAlphaNumericId(10)}`;
        try {
            const result = await this.trigger<IDetailWrapper<ITaskEventInput>>({
                input: {
                    detail: input
                },
                stateMachineArn: bgTaskSfn,
                name
            });
            return {
                ...result,
                name
            };
        } catch (ex) {
            console.log("Could not trigger a step function.");
            console.error(ex);
            return null;
        }
    }

    public async fetch(task: ITask): Promise<IStepFunctionServiceFetchResult | null> {
        const executionArn = task.eventResponse?.executionArn;
        if (!executionArn) {
            console.error(`Execution ARN not found in task "${task.id}".`);
            return null;
        }
        try {
            const result = await this.get({
                executionArn
            });
            if (!result) {
                return null;
            }
            return JSON.parse(JSON.stringify(result));
        } catch (ex) {
            console.log("Could not get the execution details.");
            console.error(ex);
            return null;
        }
    }
}

export class StepFunctionServicePlugin extends TaskServicePlugin {
    public override name = "task.stepFunctionTriggerTransport";

    public createService(params: ITaskServiceCreatePluginParams) {
        return new StepFunctionService(params);
    }
}
