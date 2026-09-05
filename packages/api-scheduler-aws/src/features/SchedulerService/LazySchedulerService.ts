import type {
    SchedulerClient,
    SchedulerClientConfig
} from "@webiny/aws-sdk/client-scheduler/index.js";
import { SchedulerService } from "@webiny/api-scheduler/shared/abstractions.js";
import { VoidSchedulerService } from "@webiny/api-scheduler/features/SchedulerService/VoidSchedulerService.js";
import { getManifest } from "~/manifest.js";
import { EventBridgeSchedulerService } from "./EventBridgeSchedulerService.js";

export type GetSchedulerClient = (config?: SchedulerClientConfig) => Pick<SchedulerClient, "send">;

/**
 * Picks the real EventBridge service or the no-op Void service, deciding on first use rather than
 * up front.
 *
 * The choice depends on the deployed scheduler manifest, and reading it is async — which is why
 * this used to be a per-request `RequestContextInitializer` that resolved the manifest and then
 * registered whichever service it implied. Every method here is already async, so the decision can
 * simply be awaited at the point of use instead.
 *
 * No memoization: `ServiceDiscovery.load()` caches the manifest in a process-wide static, so
 * `getManifest()` is cheap after the first call.
 */
class LazySchedulerServiceImpl implements SchedulerService.Interface {
    constructor(private getClient: GetSchedulerClient) {}

    private async service(): Promise<SchedulerService.Interface> {
        const manifest = await getManifest();

        if (manifest.error) {
            return new VoidSchedulerService();
        }

        return new EventBridgeSchedulerService(this.getClient, {
            lambdaArn: manifest.data.lambdaArn,
            roleArn: manifest.data.roleArn
        });
    }

    async create(params: SchedulerService.CreateParams): Promise<void> {
        return (await this.service()).create(params);
    }

    async update(params: SchedulerService.UpdateParams): Promise<void> {
        return (await this.service()).update(params);
    }

    async delete(params: SchedulerService.DeleteParams): Promise<void> {
        return (await this.service()).delete(params);
    }

    async exists(params: SchedulerService.ExistsParams): Promise<boolean> {
        return (await this.service()).exists(params);
    }
}

export const createLazySchedulerService = (
    getClient: GetSchedulerClient
): SchedulerService.Interface => new LazySchedulerServiceImpl(getClient);
