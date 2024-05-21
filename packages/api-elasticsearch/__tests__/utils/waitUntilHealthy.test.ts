import { createWaitUntilHealthy } from "~/utils/waitUntilHealthy";
import { createElasticsearchClient } from "@webiny/project-utils/testing/elasticsearch/createClient";
import { ElasticsearchCatHealthStatus } from "~/operations/types";
import { UnhealthyClusterError } from "~/utils/waitUntilHealthy/UnhealthyClusterError";

describe("wait until healthy", () => {
    const client = createElasticsearchClient();
    it("should wait until the cluster is healthy - single run", async () => {
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

    it("should wait until the cluster is health - processor - max waiting time hit", async () => {
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

    it("should wait until the cluster is health - memory - max waiting time hit", async () => {
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
});
