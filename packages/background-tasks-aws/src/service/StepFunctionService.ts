import type { DescribeExecutionCommandOutput } from "@webiny/aws-sdk/client-sfn/index.js";
import {
    createStepFunctionClient,
    describeExecutionFactory,
    triggerStepFunctionFactory
} from "@webiny/aws-sdk/client-sfn/index.js";
import type { ITaskEventInput } from "@webiny/background-tasks/api/handler/types.js";
import { generateAlphaNumericId } from "@webiny/utils";
import { ServiceDiscovery } from "@webiny/api-core/features/serviceDiscovery/index.js";
import { TaskService } from "@webiny/background-tasks/api/domain/TaskService.js";
import { TenantContext } from "@webiny/api-core/exports/api/tenancy.js";

export type IStepFunctionServiceFetchResult = DescribeExecutionCommandOutput;

export interface IDetailWrapper<T> {
    detail: T;
}

class StepFunctionServiceImpl implements TaskService.Interface {
    private readonly trigger;
    private readonly get;

    public constructor(private readonly tenantContext: TenantContext.Interface) {
        // TODO client must be injectable at some point via some factory + cache
        const client = createStepFunctionClient();
        this.trigger = triggerStepFunctionFactory(client);
        this.get = describeExecutionFactory(client);
    }
    public async send(task: TaskService.SendTaskParams, delay: number) {
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
        const tenant = this.tenantContext.getTenant();
        if (!tenant) {
            console.error("Tenant not found.");
            return null;
        }

        const input: ITaskEventInput = {
            webinyTaskId: task.id,
            webinyTaskDefinitionId: task.definitionId,
            tenant: tenant.id,
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

    public async fetch(task: TaskService.Task): Promise<IStepFunctionServiceFetchResult | null> {
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

export const StepFunctionService = TaskService.createImplementation({
    implementation: StepFunctionServiceImpl,
    dependencies: [TenantContext]
});
