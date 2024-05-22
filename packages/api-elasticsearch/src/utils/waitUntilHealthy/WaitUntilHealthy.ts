import { Client } from "~/client";
import { ElasticsearchCatHealth } from "~/operations/ElasticsearchCatHealth";
import { ElasticsearchCatNodes } from "~/operations/ElasticsearchCatNodes";
import { ElasticsearchCatHealthStatus, IElasticsearchCatNodesResponse } from "~/operations/types";
import { UnhealthyClusterError } from "~/utils/waitUntilHealthy/UnhealthyClusterError";
import { WaitingHealthyClusterAbortedError } from "./WaitingHealthyClusterAbortedError";

const WAITING_TIME_STEP = 10;

export interface IWaitUntilHealthyParams {
    /**
     * Minimum status allowed, otherwise the cluster is considered unhealthy.
     */
    minStatus: ElasticsearchCatHealthStatus.Green | ElasticsearchCatHealthStatus.Yellow;
    /**
     * Maximum processor percent allowed, otherwise the cluster is considered unhealthy.
     */
    maxProcessorPercent: number;
    /**
     * Maximum RAM percent allowed, otherwise the cluster is considered unhealthy.
     */
    maxRamPercent: number;
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

export interface IWaitCb<T> {
    (): Promise<T>;
}

export interface IWaitOptionsOnUnhealthyParams {
    startedAt: Date;
    mustEndAt: Date;
    waitingTimeStep: number;
    runs: number;
}

export interface IWaitOptionsOnTimeoutParams {
    startedAt: Date;
    mustEndAt: Date;
    waitingTimeStep: number;
    runs: number;
}

export interface IWaitOptions {
    onUnhealthy?(params: IWaitOptionsOnUnhealthyParams): Promise<void>;
    onTimeout?(params: IWaitOptionsOnTimeoutParams): Promise<void>;
}

export interface IWaitUntilHealthyWaitResponse<T> {
    result: T;
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

    public async wait<T>(
        cb: IWaitCb<T>,
        options?: IWaitOptions
    ): Promise<IWaitUntilHealthyWaitResponse<T>> {
        if (this.aborted) {
            throw new WaitingHealthyClusterAbortedError(
                `Waiting for the cluster to become healthy was aborted even before it started.`
            );
        }
        const startedAt = new Date();
        const mustEndAt = new Date(startedAt.getTime() + this.options.maxWaitingTime * 1000);
        const waitingTimeStep = this.options.waitingTimeStep || WAITING_TIME_STEP;
        let runs = 1;
        while (await this.shouldWait()) {
            if (new Date() >= mustEndAt) {
                if (options?.onTimeout) {
                    await options.onTimeout({
                        startedAt,
                        mustEndAt,
                        waitingTimeStep,
                        runs
                    });
                }
                throw new UnhealthyClusterError(this.options.maxWaitingTime);
            } else if (options?.onUnhealthy) {
                await options.onUnhealthy({
                    startedAt,
                    mustEndAt,
                    waitingTimeStep,
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
        const result = await cb();

        return {
            result,
            runningTime,
            runs
        };
    }

    private async shouldWait(): Promise<boolean> {
        const health = await this.catHealth.getHealth();
        const nodes = await this.catNodes.getNodes();

        const status = this.transformStatus(health.status);
        if (status > this.transformStatus(this.options.minStatus)) {
            return true;
        }

        const processorPercent = this.getProcessorPercent(nodes);
        if (processorPercent > this.options.maxProcessorPercent) {
            return true;
        }

        const ramPercent = this.getRamPercent(nodes);
        if (ramPercent > this.options.maxRamPercent) {
            return true;
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

    private transformStatus(status: ElasticsearchCatHealthStatus): number {
        switch (status) {
            case ElasticsearchCatHealthStatus.Green:
                return 1;
            case ElasticsearchCatHealthStatus.Yellow:
                return 2;
            case ElasticsearchCatHealthStatus.Red:
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
