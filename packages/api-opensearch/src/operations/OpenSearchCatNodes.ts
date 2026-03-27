import type { IOpenSearchCatNodesResponse } from "./types.js";
import type { Client } from "~/client.js";
import { WebinyError } from "@webiny/error";
import { stripConnectionFromException } from "~/operations/stripConnectionFromException.js";

export class OpenSearchCatNodes {
    private readonly client: Client;

    public constructor(client: Client) {
        this.client = client;
    }

    public async getNodes(): Promise<IOpenSearchCatNodesResponse> {
        try {
            const response = await this.client.cat.nodes<IOpenSearchCatNodesResponse>({
                format: "json"
            });
            if (!Array.isArray(response.body) || response.body.length === 0) {
                throw new WebinyError({
                    message: `There is no valid response from cat.nodes operation.`,
                    code: "OPENSEARCH_NODES_INVALID_RESPONSE",
                    data: response.body
                });
            }
            return response.body;
        } catch (ex) {
            console.error(`Could not fetch cluster nodes information: ${ex.message}`);
            const error = stripConnectionFromException(ex);
            console.log(JSON.stringify(error));
            throw error;
        }
    }
}
