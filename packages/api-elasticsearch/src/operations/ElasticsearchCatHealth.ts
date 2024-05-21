import { WebinyError } from "@webiny/error";
import { Client } from "~/client";
import { IElasticsearchCatHealthResponse } from "./types";

export class ElasticsearchCatHealth {
    private readonly client: Client;

    public constructor(client: Client) {
        this.client = client;
    }

    public async getHealth(): Promise<IElasticsearchCatHealthResponse> {
        try {
            const response = await this.client.cat.health<
                unknown | [IElasticsearchCatHealthResponse]
            >({
                format: "json"
            });

            if (!Array.isArray(response.body) || response.body.length === 0) {
                throw new WebinyError({
                    message: `There is no valid response from cat.health operation.`,
                    code: "ELASTICSEARCH_HEALTH_INVALID_RESPONSE",
                    data: response.body
                });
            }

            return {
                ...response.body[0]
            };
        } catch (ex) {
            console.error(`Could not fetch cluster health information: ${ex.message}`);
            console.log(ex);
            throw ex;
        }
    }
}
