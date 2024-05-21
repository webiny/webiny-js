import { createElasticsearchClient } from "@webiny/project-utils/testing/elasticsearch/createClient";
import { ElasticsearchCatHealth, ElasticsearchCatNodes } from "~/operations";
import { IElasticsearchCatNodeResponse, IElasticsearchCatNodesResponse } from "~/operations/types";

describe("cat nodes", () => {
    it("should fetch nodes information", async () => {
        const client = createElasticsearchClient();
        const catNodes = new ElasticsearchCatNodes(client);

        const expected: Partial<IElasticsearchCatNodeResponse>[] = [
            {
                "heap.percent": expect.any(String),
                "ram.percent": expect.any(String),
                cpu: expect.any(String),
                load_1m: expect.any(String),
                "node.role": expect.any(String),
                ip: expect.any(String),
                master: expect.any(String),
                name: expect.any(String)
            }
        ];

        const result = await catNodes.getNodes();

        expect(result).toMatchObject(expected);
    });
});
