import { describe, expect, it } from "vitest";
import { createOpenSearchClient } from "../helpers";
import { OpenSearchCatNodes } from "~/operations/index.js";
import { IOpenSearchCatNodeResponse } from "~/operations/types.js";

describe("cat nodes", () => {
    it("should fetch nodes information", async () => {
        const client = createOpenSearchClient();
        const catNodes = new OpenSearchCatNodes(client);

        const expected: Partial<IOpenSearchCatNodeResponse> = {
            "heap.percent": expect.any(String),
            "ram.percent": expect.any(String),
            cpu: expect.any(String),
            load_1m: expect.any(String),
            "node.role": expect.any(String),
            ip: expect.any(String),
            name: expect.any(String)
        };
        const result = await catNodes.getNodes();
        expect(result.length).toBeGreaterThanOrEqual(1);
        for (const node of result) {
            expect(node).toMatchObject(expected);
        }
    });
});
