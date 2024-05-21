import { IElasticsearchCatNodesResponse } from "./types";
import { Client } from "~/client";
import { WebinyError } from "@webiny/error";

export class ElasticsearchCatNodes {
    private readonly client: Client;

    public constructor(client: Client) {
        this.client = client;
    }

    public async getNodes(): Promise<IElasticsearchCatNodesResponse> {
        try {
            const response = await this.client.cat.nodes<IElasticsearchCatNodesResponse>({
                format: "json"
            });
            if (!Array.isArray(response.body) || response.body.length === 0) {
                throw new WebinyError(`There is no valid response from cat.nodes operation.`);
            }
            return response.body;
        } catch (ex) {
            console.error(`Could not fetch cluster nodes information: ${ex.message}`);
            console.log(ex);
            throw ex;
        }
    }
}
