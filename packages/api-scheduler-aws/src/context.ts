import type { Container } from "@webiny/di";
import type {
    SchedulerClient,
    SchedulerClientConfig
} from "@webiny/aws-sdk/client-scheduler/index.js";
import { SchedulerService } from "@webiny/api-scheduler/shared/abstractions.js";
import { createLazySchedulerService } from "~/features/SchedulerService/LazySchedulerService.js";

export interface IRegisterSchedulerAwsExtensionParams {
    getClient(config?: SchedulerClientConfig): Pick<SchedulerClient, "send">;
}

/**
 * Registers the AWS (EventBridge Scheduler) transport for the scheduler.
 *
 * `SchedulerService` is bound at register time to a lazy implementation that reads the deployed
 * scheduler manifest on first use and delegates to either the EventBridge service or the no-op Void
 * service. Previously this was a per-request `RequestContextInitializer`, because the manifest read
 * is async and DI resolution is not — along with a `getTenant()` guard, since a fixed-time hook can
 * fire before the tenant is established. Neither is needed once the async work moves into the
 * methods, which were already async.
 */
export const registerSchedulerAwsExtension = (
    container: Container,
    params: IRegisterSchedulerAwsExtensionParams
) => {
    container.registerInstance(SchedulerService, createLazySchedulerService(params.getClient));
};
