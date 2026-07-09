import type { Container } from "@webiny/di";
import { RequestContextInitializer } from "@webiny/event-handler-core";
import type {
    SchedulerClient,
    SchedulerClientConfig
} from "@webiny/aws-sdk/client-scheduler/index.js";
import { getManifest } from "~/manifest.js";
import { SchedulerService } from "@webiny/api-scheduler/shared/abstractions.js";
import { EventBridgeSchedulerService } from "~/features/SchedulerService/EventBridgeSchedulerService.js";
import { VoidSchedulerService } from "@webiny/api-scheduler/features/SchedulerService/VoidSchedulerService.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";

export interface IRegisterSchedulerAwsExtensionParams {
    getClient(config?: SchedulerClientConfig): Pick<SchedulerClient, "send">;
}

/**
 * Registers the AWS (EventBridge Scheduler) transport for the scheduler. Binds `SchedulerService`
 * per-request via a RequestContextInitializer (post-tenant): resolves the deployed scheduler
 * manifest and picks the EventBridge service, or a no-op Void service when the manifest is missing.
 */
export const registerSchedulerAwsExtension = (
    container: Container,
    params: IRegisterSchedulerAwsExtensionParams
) => {
    container.registerInstance(RequestContextInitializer, {
        async init(ctx: Record<string, any>) {
            const requestContainer = ctx.container as Container;

            if (!requestContainer.resolve(TenantContext).getTenant()) {
                return;
            }

            const manifest = await getManifest();

            if (manifest.error) {
                requestContainer.registerInstance(SchedulerService, new VoidSchedulerService());
            } else {
                requestContainer.registerInstance(
                    SchedulerService,
                    new EventBridgeSchedulerService(params.getClient, {
                        lambdaArn: manifest.data.lambdaArn,
                        roleArn: manifest.data.roleArn
                    })
                );
            }
        }
    });
};
