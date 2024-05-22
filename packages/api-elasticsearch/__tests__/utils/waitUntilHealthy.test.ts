import { createWaitUntilHealthy } from "~/utils/waitUntilHealthy";
import { createElasticsearchClient } from "@webiny/project-utils/testing/elasticsearch/createClient";
import { ElasticsearchCatHealthStatus } from "~/operations/types";
import { UnhealthyClusterError } from "~/utils/waitUntilHealthy/UnhealthyClusterError";

describe("wait until healthy", () => {
    const client = createElasticsearchClient();

    it.skip("should wait until the cluster is healthy - single run", async () => {
        const waitUntilHealthy = createWaitUntilHealthy(client, {
            minStatus: ElasticsearchCatHealthStatus.Yellow,
            maxProcessorPercent: 101,
            maxWaitingTime: 30,
            waitingTimeStep: 5,
            maxRamPercent: 101
        });

        const { result, runs, runningTime } = await waitUntilHealthy.wait(async () => {
            return "healthy";
        });

        expect(runs).toEqual(1);
        expect(runningTime).toBeLessThan(30000);
        expect(result).toEqual("healthy");
    });

    it.skip("should wait until the cluster is health - processor - max waiting time hit", async () => {
        expect.assertions(2);
        const waitUntilHealthy = createWaitUntilHealthy(client, {
            minStatus: ElasticsearchCatHealthStatus.Yellow,
            maxProcessorPercent: 1,
            maxWaitingTime: 3,
            waitingTimeStep: 1,
            maxRamPercent: 99
        });

        try {
            await waitUntilHealthy.wait(async () => {
                return "should not reach this";
            });
        } catch (ex) {
            expect(ex).toBeInstanceOf(UnhealthyClusterError);
            expect(ex.message).toEqual("Cluster did not become healthy in 3 seconds.");
        }
    });

    it.skip("should wait until the cluster is health - memory - max waiting time hit", async () => {
        expect.assertions(2);
        const waitUntilHealthy = createWaitUntilHealthy(client, {
            minStatus: ElasticsearchCatHealthStatus.Yellow,
            maxProcessorPercent: 99,
            maxWaitingTime: 3,
            waitingTimeStep: 1,
            maxRamPercent: 1
        });

        try {
            const { result } = await waitUntilHealthy.wait(async () => {
                return "should not reach this";
            });
            expect(result).toEqual("reaching here would fail the test");
        } catch (ex) {
            expect(ex).toBeInstanceOf(UnhealthyClusterError);
            expect(ex.message).toEqual("Cluster did not become healthy in 3 seconds.");
        }
    });

    it.skip("should trigger onUnhealthy callback - once", async () => {
        expect.assertions(2);
        const waitUntilHealthy = createWaitUntilHealthy(client, {
            minStatus: ElasticsearchCatHealthStatus.Green,
            maxProcessorPercent: 1,
            maxWaitingTime: 1,
            waitingTimeStep: 3,
            maxRamPercent: 1
        });

        const fn = jest.fn();

        try {
            await waitUntilHealthy.wait(
                async () => {
                    return "should not reach this";
                },
                {
                    async onUnhealthy() {
                        fn();
                    }
                }
            );
        } catch (ex) {
            expect(ex).toBeInstanceOf(UnhealthyClusterError);
        }

        expect(fn).toHaveBeenCalledTimes(1);
    });

    it.skip("should trigger onUnhealthy callback - multiple times", async () => {
        expect.assertions(2);
        const waitUntilHealthy = createWaitUntilHealthy(client, {
            minStatus: ElasticsearchCatHealthStatus.Green,
            maxProcessorPercent: 1,
            maxWaitingTime: 3,
            waitingTimeStep: 1,
            maxRamPercent: 1
        });

        const fn = jest.fn();

        try {
            await waitUntilHealthy.wait(
                async () => {
                    return "should not reach this";
                },
                {
                    async onUnhealthy() {
                        fn();
                    }
                }
            );
        } catch (ex) {
            expect(ex).toBeInstanceOf(UnhealthyClusterError);
        }

        expect(fn).toHaveBeenCalledTimes(3);
    });

    it("should trigger onTimeout callback - once", async () => {
        expect.assertions(3);
        const waitUntilHealthy = createWaitUntilHealthy(client, {
            minStatus: ElasticsearchCatHealthStatus.Green,
            maxProcessorPercent: 1,
            maxWaitingTime: 3,
            waitingTimeStep: 1,
            maxRamPercent: 1
        });

        const onUnhealthy = jest.fn();
        const onTimeout = jest.fn();

        try {
            await waitUntilHealthy.wait(
                async () => {
                    return "should not reach this";
                },
                {
                    async onUnhealthy() {
                        onUnhealthy();
                    },
                    async onTimeout() {
                        onTimeout();
                    }
                }
            );
        } catch (ex) {
            expect(ex).toBeInstanceOf(UnhealthyClusterError);
        }

        expect(onUnhealthy).toHaveBeenCalledTimes(3);
        expect(onTimeout).toHaveBeenCalledTimes(1);
    });
});
