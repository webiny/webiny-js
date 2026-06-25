import { describe, expect, it } from "vitest";
import { OpenSearchCatHealth } from "~/operations/OpenSearchCatHealth.js";
import { getTestOpenSearchClient } from "~/testing/index.js";
import { IOpenSearchCatHealthResponse } from "~/operations/types.js";

describe("cat health", () => {
    it("should fetch health information", async () => {
        const client = getTestOpenSearchClient();
        const catHealth = new OpenSearchCatHealth(client);

        const expected: IOpenSearchCatHealthResponse = {
            status: expect.stringMatching(/^green|yellow|red$/),
            "node.data": expect.stringMatching(/^\d+$/),
            "node.total": expect.stringMatching(/^\d+$/),
            shards: expect.stringMatching(/^\d+$/),
            active_shards_percent: expect.stringMatching(/^([0-9]*[.])?[0-9]%$/),
            init: expect.stringMatching(/^\d+$/),
            epoch: expect.stringMatching(/^\d+$/),
            timestamp: expect.stringMatching(/^\d+:\d+:\d+$/),
            cluster: expect.any(String),
            pri: expect.stringMatching(/^\d+$/),
            relo: expect.stringMatching(/^\d+$/),
            unassign: expect.stringMatching(/^\d+$/),
            pending_tasks: expect.stringMatching(/^\d+$/),
            max_task_wait_time: expect.any(String)
        };

        const response = await catHealth.getHealth();
        expect(response).toMatchObject(expected);
    });
});
