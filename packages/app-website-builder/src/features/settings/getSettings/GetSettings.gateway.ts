import type { ApolloClient } from "@apollo/client";
import gql from "graphql-tag";
import type { GenericRecord } from "@webiny/app/types.js";
import { WebinyError } from "@webiny/error";
import type { IGetSettings } from "./IGetSettings.js";
import type { IWebsiteBuilderSettings } from "~/features/settings/IWebsiteBuilderSettings.js";

const QUERY = gql`
    query GetWebsiteBuilderSettings {
        websiteBuilder {
            getSettings {
                data {
                    previewDomain
                }
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
        getSettings:
            | {
                  data: {
                      previewDomain: string;
                  };
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

export class GetSettingsGqlGateway implements IGetSettings {
    private client: ApolloClient;

    constructor(client: ApolloClient) {
        this.client = client;
    }

    async execute(): Promise<IWebsiteBuilderSettings | undefined> {
        const query = await this.client.query<QueryType>({
            query: QUERY,
            fetchPolicy: "no-cache"
        });

        const { data, error } = query.data?.websiteBuilder.getSettings || {};

        if (error) {
            throw new WebinyError(error);
        }

        return data;
    }
}
