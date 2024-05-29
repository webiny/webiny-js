import { Client } from "~/client";
import { ElasticsearchCatHealth } from "~/operations/ElasticsearchCatHealth";
import { ElasticsearchCatNodes } from "~/operations/ElasticsearchCatNodes";
import {
    ElasticsearchCatClusterHealthStatus,
    IElasticsearchCatNodesResponse
} from "~/operations/types";
import { UnhealthyClusterError } from "~/utils/waitUntilHealthy/UnhealthyClusterError";
import {
    createClusterHealthStatusReason,
    createMemoryReason,
    createProcessorReason,
    IClusterHealthReason,
    IMemoryReason,
    IProcessorReason
} from "./reason";
import { WaitingHealthyClusterAbortedError } from "./WaitingHealthyClusterAbortedError";

const WAITING_TIME_STEP = 10;

export type ShouldNotWait = false;

export type WaitingReason = IProcessorReason | IMemoryReason | IClusterHealthReason | ShouldNotWait;

export interface IWaitUntilHealthyParams {
    /**
     * Minimum status allowed, otherwise the cluster is considered unhealthy.
     */
    minClusterHealthStatus:
        | ElasticsearchCatClusterHealthStatus.Green
        | ElasticsearchCatClusterHealthStatus.Yellow;
    /**
     * Maximum processor percent allowed, otherwise the cluster is considered unhealthy.
     */
    maxProcessorPercent: number;
    /**
     * Maximum RAM percent allowed, otherwise the cluster is considered unhealthy.
     */
    maxRamPercent?: number;
    /**
     * Maximum time to wait in seconds.
     * This is to prevent infinite waiting in case the cluster never becomes healthy.
     */
    maxWaitingTime: number;
    /**
     * Time in seconds to wait between each check.
     * This is to prevent spamming the cluster with requests.
     * Default is WAITING_TIME_STEP seconds.
     */
    waitingTimeStep?: number;
}

export interface IWaitOptionsOnUnhealthyParams {
    startedAt: Date;
    mustEndAt: Date;
    waitingTimeStep: number;
    runs: number;
    waitingReason: WaitingReason;
}

export interface IWaitOptionsOnTimeoutParams {
    startedAt: Date;
    mustEndAt: Date;
    waitingTimeStep: number;
    runs: number;
    waitingReason: WaitingReason;
}

export interface IWaitOptions {
    onUnhealthy?(params: IWaitOptionsOnUnhealthyParams): Promise<void>;
    onTimeout?(params: IWaitOptionsOnTimeoutParams): Promise<void>;
}

export interface IWaitUntilHealthyWaitResponse {
    runningTime: number;
    runs: number;
}

class WaitUntilHealthy {
    private readonly client: Client;
    private readonly options: IWaitUntilHealthyParams;

    private readonly catHealth: ElasticsearchCatHealth;
    private readonly catNodes: ElasticsearchCatNodes;

    private aborted = false;

    public constructor(client: Client, options: IWaitUntilHealthyParams) {
        this.client = client;
        this.options = options;

        this.catHealth = new ElasticsearchCatHealth(this.client);
        this.catNodes = new ElasticsearchCatNodes(this.client);
    }

    public abort(): void {
        this.aborted = true;
    }
    /**
     * @throws UnhealthyClusterError
     * @throws WaitingHealthyClusterAbortedError
     */
    public async wait(options?: IWaitOptions): Promise<IWaitUntilHealthyWaitResponse> {
        if (this.aborted) {
            throw new WaitingHealthyClusterAbortedError(
                `Waiting for the cluster to become healthy was aborted even before it started.`
            );
        }
        const startedAt = new Date();
        const mustEndAt = new Date(startedAt.getTime() + this.options.maxWaitingTime * 1000);
        const waitingTimeStep = this.options.waitingTimeStep || WAITING_TIME_STEP;
        let runs = 1;
        let waitingReason: WaitingReason;
        while ((waitingReason = await this.shouldWait())) {
            if (new Date() >= mustEndAt) {
                if (options?.onTimeout) {
                    await options.onTimeout({
                        startedAt,
                        mustEndAt,
                        waitingTimeStep,
                        waitingReason,
                        runs
                    });
                }
                throw new UnhealthyClusterError(this.options.maxWaitingTime);
            } else if (options?.onUnhealthy) {
                await options.onUnhealthy({
                    startedAt,
                    mustEndAt,
                    waitingTimeStep,
                    waitingReason,
                    runs
                });
            }
            /**
             * Abort check is separated from other IFs because it can be aborted in onUnhealthy callback.
             */
            if (this.aborted) {
                throw new WaitingHealthyClusterAbortedError();
            }
            runs++;
            await new Promise(resolve => {
                setTimeout(resolve, waitingTimeStep * 1000);
            });
        }

        const runningTime = new Date().getTime() - startedAt.getTime();

        return {
            runningTime,
            runs
        };
    }

    private async shouldWait(): Promise<WaitingReason> {
        const health = await this.catHealth.getHealth();
        const nodes = await this.catNodes.getNodes();

        const clusterHealthStatus = this.transformClusterHealthStatus(health.status);
        const minClusterHealthStatus = this.transformClusterHealthStatus(
            this.options.minClusterHealthStatus
        );
        if (clusterHealthStatus > minClusterHealthStatus) {
            return createClusterHealthStatusReason({
                minimum: this.options.minClusterHealthStatus,
                current: health.status
            });
        }

        const processorPercent = this.getProcessorPercent(nodes);
        if (processorPercent > this.options.maxProcessorPercent) {
            return createProcessorReason({
                maximum: this.options.maxProcessorPercent,
                current: processorPercent
            });
        }
        /**
         * Possibly no max ram definition?
         */
        if (this.options.maxRamPercent === undefined) {
            return false;
        }

        const ramPercent = this.getRamPercent(nodes);
        if (ramPercent > this.options.maxRamPercent) {
            return createMemoryReason({
                maximum: this.options.maxRamPercent,
                current: ramPercent
            });
        }
        return false;
    }

    private getProcessorPercent(nodes: IElasticsearchCatNodesResponse): number {
        const total = nodes.reduce<number>((total, node) => {
            return total + parseFloat(node.cpu);
        }, 0);
        return total / nodes.length;
    }

    private getRamPercent(nodes: IElasticsearchCatNodesResponse): number {
        const total = nodes.reduce<number>((total, node) => {
            return total + parseFloat(node["ram.percent"]);
        }, 0);
        return total / nodes.length;
    }

    private transformClusterHealthStatus(status: ElasticsearchCatClusterHealthStatus): number {
        switch (status) {
            case ElasticsearchCatClusterHealthStatus.Green:
                return 1;
            case ElasticsearchCatClusterHealthStatus.Yellow:
                return 2;
            case ElasticsearchCatClusterHealthStatus.Red:
                return 3;
            default:
                return 99;
        }
    }
}

export type { WaitUntilHealthy };

export const createWaitUntilHealthy = (
    client: Client,
    params: IWaitUntilHealthyParams
): WaitUntilHealthy => {
    return new WaitUntilHealthy(client, params);
};
