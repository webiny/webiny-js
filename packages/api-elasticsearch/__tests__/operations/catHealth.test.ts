import { ElasticsearchCatHealth } from "~/operations/ElasticsearchCatHealth";
import { createElasticsearchClient } from "../helpers";
import { IElasticsearchCatHealthResponse } from "~/operations/types";

describe("cat health", () => {
    it("should fetch health information", async () => {
        const client = createElasticsearchClient();
        const catHealth = new ElasticsearchCatHealth(client);

        const expected: IElasticsearchCatHealthResponse = {
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
