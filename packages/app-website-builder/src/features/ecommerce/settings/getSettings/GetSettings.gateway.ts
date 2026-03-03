import type { ApolloClient } from "@apollo/client";
import gql from "graphql-tag";
import type { GenericRecord } from "@webiny/app/types.js";
import { WebinyError } from "@webiny/error";
import type { IGetSettings } from "./IGetSettings.js";
import type { AllEcommerceSettings } from "~/features/ecommerce/settings/types.js";

const QUERY = gql`
    query GetIntegrationsSettings {
        websiteBuilder {
            getIntegrations {
                data
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

interface QueryType {
    websiteBuilder: {
        getIntegrations:
            | {
                  data: GenericRecord<string>;
                  error: undefined;
              }
            | {
                  data: undefined;
                  error: {
                      code: string;
                      message: string;
                      data: GenericRecord<string>;
                  };
              };
    };
}

export class GetSettingsGateway implements IGetSettings {
    private client: ApolloClient;

    constructor(client: ApolloClient) {
        this.client = client;
    }

    async execute(): Promise<AllEcommerceSettings> {
        const query = await this.client.query<QueryType>({
            query: QUERY,
            fetchPolicy: "no-cache"
        });

        const { data, error } = query.data.websiteBuilder.getIntegrations;

        if (error) {
            throw new WebinyError(error);
        }

        return data;
    }
}
