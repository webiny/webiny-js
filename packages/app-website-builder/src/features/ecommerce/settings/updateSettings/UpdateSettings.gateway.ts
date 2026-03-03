import type { ApolloClient } from "@apollo/client";
import gql from "graphql-tag";
import type { GenericRecord } from "@webiny/app/types.js";
import { WebinyError } from "@webiny/error";
import type { IUpdateSettings } from "./IUpdateSettings.js";
import type { AllEcommerceSettings } from "~/features/ecommerce/settings/types.js";

const MUTATION = gql`
    mutation UpdateWebsiteBuilderSettings($settings: JSON!) {
        websiteBuilder {
            updateIntegrations(data: $settings) {
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
        updateIntegrations:
            | {
                  data: boolean;
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

export class UpdateSettingsGateway implements IUpdateSettings {
    private client: ApolloClient;

    constructor(client: ApolloClient) {
        this.client = client;
    }

    async execute(settings: AllEcommerceSettings): Promise<void> {
        const { data: response } = await this.client.mutate<QueryType>({
            mutation: MUTATION,
            variables: {
                settings
            }
        });

        if (!response) {
            throw new Error("Network error while updating ecommerce settings.");
        }

        const { error } = response.websiteBuilder.updateIntegrations;

        if (error) {
            throw new WebinyError(error);
        }
    }
}
