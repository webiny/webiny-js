import {
    ITaskTriggerTransport,
    ITaskTriggerTransportPluginParams,
    ITaskTriggerTransportTask,
    TaskTriggerTransportPlugin
} from "~/plugins";
import { GenericRecord } from "@webiny/api/types";
import { triggerStepFunctionFactory } from "@webiny/aws-sdk/client-sfn";
import { ITaskEventInput } from "~/handler/types";
import { generateAlphaNumericId } from "@webiny/utils";
import { ServiceDiscovery } from "@webiny/api";

export interface IDetailWrapper<T> {
    detail: T;
}

class StepFunctionTriggerTransport implements ITaskTriggerTransport<GenericRecord | null> {
    private readonly getTenant: () => string;
    private readonly getLocale: () => string;
    private readonly trigger: ReturnType<typeof triggerStepFunctionFactory>;

    public constructor(params: ITaskTriggerTransportPluginParams) {
        this.getTenant = params.getTenant;
        this.getLocale = params.getLocale;
        this.trigger = triggerStepFunctionFactory({
            cache: true
        });
    }
    public async send(task: ITaskTriggerTransportTask, delay: number) {
        const manifest = await ServiceDiscovery.load();
        if (!manifest) {
            console.error("Service manifest not found.");
            return null;
        }
        const { bgTaskSfn } = manifest.api || {};
        if (!bgTaskSfn) {
            console.log(manifest);
            console.error("Background task state machine not found.");
            return null;
        }
        /**
         * The ITaskEvent is what our handler expect to get.
         * Endpoint and stateMachineId are added by the step function.
         */
        const input: ITaskEventInput = {
            webinyTaskId: task.id,
            webinyTaskDefinitionId: task.definitionId,
            tenant: this.getTenant(),
            locale: this.getLocale(),
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
}

export class StepFunctionTriggerTransportPlugin extends TaskTriggerTransportPlugin<GenericRecord | null> {
    public override name = "task.stepFunctionTriggerTransport";

    public createTransport(params: ITaskTriggerTransportPluginParams) {
        return new StepFunctionTriggerTransport(params);
    }
}
