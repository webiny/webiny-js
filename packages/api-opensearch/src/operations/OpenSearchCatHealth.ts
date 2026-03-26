import { WebinyError } from "@webiny/error";
import type { Client } from "~/client.js";
import type { IOpenSearchCatHealthResponse } from "./types.js";
import { stripConnectionFromException } from "~/operations/stripConnectionFromException.js";

export class OpenSearchCatHealth {
    private readonly client: Client;

    public constructor(client: Client) {
        this.client = client;
    }

    public async getHealth(): Promise<IOpenSearchCatHealthResponse> {
        try {
            const response = await this.client.cat.health<unknown | [IOpenSearchCatHealthResponse]>(
                {
                    format: "json"
                }
            );

            if (!Array.isArray(response.body) || response.body.length === 0) {
                throw new WebinyError({
                    message: `There is no valid response from cat.health operation.`,
                    code: "OPENSEARCH_HEALTH_INVALID_RESPONSE",
                    data: response.body
                });
            }

            return {
                ...response.body[0]
            };
        } catch (ex) {
            console.error(`Could not fetch cluster health information: ${ex.message}`);
            const error = stripConnectionFromException(ex);
            console.log(JSON.stringify(error));
            throw error;
        }
    }
}
