import { describe, expect, it, vi } from "vitest";
import { createWaitUntilHealthy } from "~/utils/waitUntilHealthy/index.js";
import { createOpenSearchClient } from "../helpers";
import { OpenSearchCatClusterHealthStatus } from "~/operations/types.js";
import { UnhealthyClusterError } from "~/utils/waitUntilHealthy/UnhealthyClusterError.js";
import { WaitingHealthyClusterAbortedError } from "~/utils/waitUntilHealthy/WaitingHealthyClusterAbortedError.js";

describe("wait until healthy", () => {
    const client = createOpenSearchClient();

    it("should wait until the cluster is healthy - single run", async () => {
        const waitUntilHealthy = createWaitUntilHealthy(client, {
            minClusterHealthStatus: OpenSearchCatClusterHealthStatus.Yellow,
            maxProcessorPercent: 101,
            maxRamPercent: 101,
            maxWaitingTime: 30,
            waitingTimeStep: 5
        });

        const { runs, runningTime } = await waitUntilHealthy.wait();

        expect(runs).toEqual(1);
        expect(runningTime).toBeLessThan(30000);
    });

    it("should wait until the cluster is healthy - no max memory defined", async () => {
        const waitUntilHealthy = createWaitUntilHealthy(client, {
            minClusterHealthStatus: OpenSearchCatClusterHealthStatus.Yellow,
            maxProcessorPercent: 101,
            maxWaitingTime: 30,
            waitingTimeStep: 5
        });

        const { runs, runningTime } = await waitUntilHealthy.wait();

        expect(runs).toEqual(1);
        expect(runningTime).toBeLessThan(30000);
    });

    it("should wait until the cluster is health - processor - max waiting time hit", async () => {
        expect.assertions(2);
        const waitUntilHealthy = createWaitUntilHealthy(client, {
            minClusterHealthStatus: OpenSearchCatClusterHealthStatus.Yellow,
            maxProcessorPercent: 1,
            maxRamPercent: 1,
            maxWaitingTime: 3,
            waitingTimeStep: 1
        });

        try {
            await waitUntilHealthy.wait();
            throw new Error("Should not reach here!");
        } catch (ex) {
            expect(ex).toBeInstanceOf(UnhealthyClusterError);
            expect(ex.message).toEqual("Cluster did not become healthy in 3 seconds.");
        }
    });

    it("should wait until the cluster is health - memory - max waiting time hit", async () => {
        expect.assertions(2);
        const waitUntilHealthy = createWaitUntilHealthy(client, {
            minClusterHealthStatus: OpenSearchCatClusterHealthStatus.Yellow,
            maxProcessorPercent: 99,
            maxRamPercent: 1,
            maxWaitingTime: 3,
            waitingTimeStep: 1
        });

        try {
            const { runs } = await waitUntilHealthy.wait();
            expect(runs).toEqual("reaching here would fail the test");
            throw new Error("Should not reach here!");
        } catch (ex) {
            expect(ex).toBeInstanceOf(UnhealthyClusterError);
            expect(ex.message).toEqual("Cluster did not become healthy in 3 seconds.");
        }
    });

    it("should trigger onUnhealthy callback - once", async () => {
        expect.assertions(2);
        const waitUntilHealthy = createWaitUntilHealthy(client, {
            minClusterHealthStatus: OpenSearchCatClusterHealthStatus.Green,
            maxProcessorPercent: 1,
            maxRamPercent: 1,
            maxWaitingTime: 1,
            waitingTimeStep: 3
        });

        const onUnhealthy = vi.fn();

        try {
            const { runs } = await waitUntilHealthy.wait({
                async onUnhealthy() {
                    onUnhealthy();
                }
            });
            expect(runs).toEqual("reaching here would fail the test");
            throw new Error("Should not reach here!");
        } catch (ex) {
            expect(ex).toBeInstanceOf(UnhealthyClusterError);
        }

        expect(onUnhealthy).toHaveBeenCalledTimes(1);
    });

    it("should trigger onTimeout callback - once", async () => {
        expect.assertions(3);
        const waitUntilHealthy = createWaitUntilHealthy(client, {
            minClusterHealthStatus: OpenSearchCatClusterHealthStatus.Green,
            maxProcessorPercent: 1,
            maxRamPercent: 1,
            maxWaitingTime: 3,
            waitingTimeStep: 1
        });

        const onUnhealthy = vi.fn();
        const onTimeout = vi.fn();

        try {
            const { runs } = await waitUntilHealthy.wait({
                async onUnhealthy() {
                    onUnhealthy();
                },
                async onTimeout() {
                    onTimeout();
                }
            });
            expect(runs).toEqual("reaching here would fail the test");
            throw new Error("Should not reach here!");
        } catch (ex) {
            expect(ex).toBeInstanceOf(UnhealthyClusterError);
        }

        expect(onUnhealthy).toHaveBeenCalledTimes(3);
        expect(onTimeout).toHaveBeenCalledTimes(1);
    });

    it("should trigger abort even before the checks start", async () => {
        expect.assertions(3);
        const waitUntilHealthy = createWaitUntilHealthy(client, {
            minClusterHealthStatus: OpenSearchCatClusterHealthStatus.Green,
            maxProcessorPercent: 1,
            maxRamPercent: 1,
            maxWaitingTime: 1,
            waitingTimeStep: 3
        });

        waitUntilHealthy.abort();

        const onUnhealthy = vi.fn();
        const onTimeout = vi.fn();

        try {
            const { runs } = await waitUntilHealthy.wait({
                async onUnhealthy() {
                    onUnhealthy();
                    waitUntilHealthy.abort();
                },
                async onTimeout() {
                    onTimeout();
                }
            });
            expect(runs).toEqual("reaching here would fail the test");
            throw new Error("Should not reach here!");
        } catch (ex) {
            expect(ex).toBeInstanceOf(WaitingHealthyClusterAbortedError);
        }

        expect(onUnhealthy).toHaveBeenCalledTimes(0);
        expect(onTimeout).toHaveBeenCalledTimes(0);
    });

    it("should trigger abort in onUnhealthy callback", async () => {
        expect.assertions(2);
        const waitUntilHealthy = createWaitUntilHealthy(client, {
            minClusterHealthStatus: OpenSearchCatClusterHealthStatus.Green,
            maxProcessorPercent: 1,
            maxRamPercent: 1,
            maxWaitingTime: 1,
            waitingTimeStep: 3
        });

        const onUnhealthy = vi.fn();

        try {
            const { runs } = await waitUntilHealthy.wait({
                async onUnhealthy() {
                    onUnhealthy();
                    waitUntilHealthy.abort();
                }
            });
            expect(runs).toEqual("reaching here would fail the test");
            throw new Error("Should not reach here!");
        } catch (ex) {
            expect(ex).toBeInstanceOf(WaitingHealthyClusterAbortedError);
        }

        expect(onUnhealthy).toHaveBeenCalledTimes(1);
    });
});
