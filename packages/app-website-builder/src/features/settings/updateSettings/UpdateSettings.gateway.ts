import type { ApolloClient } from "@apollo/client";
import gql from "graphql-tag";
import type { GenericRecord } from "@webiny/app/types.js";
import { WebinyError } from "@webiny/error";
import type { IUpdateSettings } from "./IUpdateSettings.js";
import type { IWebsiteBuilderSettings } from "~/features/settings/IWebsiteBuilderSettings.js";

const MUTATION = gql`
    mutation UpdateWebsiteBuilderSettings($settings: WbSettingsInput!) {
        websiteBuilder {
            updateSettings(data: $settings) {
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
        updateSettings:
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

export class UpdateSettingsGqlGateway implements IUpdateSettings {
    private client: ApolloClient;

    constructor(client: ApolloClient) {
        this.client = client;
    }

    async execute(settings: IWebsiteBuilderSettings): Promise<void> {
        const { data: response } = await this.client.mutate<QueryType>({
            mutation: MUTATION,
            variables: {
                settings
            }
        });

        if (!response) {
            throw new Error("Network error while updating settings.");
        }

        const { error } = response.websiteBuilder.updateSettings;

        if (error) {
            throw new WebinyError(error);
        }
    }
}
