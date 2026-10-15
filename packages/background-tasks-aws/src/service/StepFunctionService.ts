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
import { Logger } from "@webiny/api-core/features/logger/index.js";

export type IStepFunctionServiceFetchResult = DescribeExecutionCommandOutput;

export interface IDetailWrapper<T> {
    detail: T;
}

class StepFunctionServiceImpl implements TaskService.Interface {
    private readonly trigger;
    private readonly get;

    public constructor(
        private readonly tenantContext: TenantContext.Interface,
        private readonly logger: Logger.Interface
    ) {
        // TODO client must be injectable at some point via some factory + cache
        const client = createStepFunctionClient();
        this.trigger = triggerStepFunctionFactory(client);
        this.get = describeExecutionFactory(client);
    }
    public async send(task: TaskService.SendTaskParams, delay: number) {
        const manifest = await ServiceDiscovery.load();
        if (!manifest) {
            this.logger.error("Service manifest not found.");
            return null;
        }
        const { bgTaskSfn } = manifest.api || {};
        if (!bgTaskSfn) {
            this.logger.error("Background task state machine not found.");
            return null;
        }
        const tenant = this.tenantContext.getTenant();
        if (!tenant) {
            this.logger.error("Tenant not found.");
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
            this.logger.error({ error: ex }, "Could not trigger a step function.");
            return null;
        }
    }

    public async fetch(task: TaskService.Task): Promise<IStepFunctionServiceFetchResult | null> {
        const executionArn = task.eventResponse?.executionArn;
        if (!executionArn) {
            this.logger.error(`Execution ARN not found in task "${task.id}".`);
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
            this.logger.error({ error: ex }, "Could not get the execution details.");
            return null;
        }
    }
}

export const StepFunctionService = TaskService.createImplementation({
    implementation: StepFunctionServiceImpl,
    dependencies: [TenantContext, Logger]
});
