import type ApolloClient from "apollo-client";
import gql from "graphql-tag";
import type { GenericRecord } from "@webiny/app/types";
import { WebinyError } from "@webiny/error";
import type { IEcommerceSettings, IGetEcommerceSettings } from "./IGetEcommerceSettings";

const QUERY = gql`
    query GetEcommerceSettings($name: ID!) {
        websiteBuilder {
            getEcommerceSettings(name: $name) {
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
        getEcommerceSettings:
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

export class GetSettingsGqlGateway implements IGetEcommerceSettings {
    private client: ApolloClient<any>;

    constructor(client: ApolloClient<any>) {
        this.client = client;
    }

    async execute(name: string): Promise<IEcommerceSettings> {
        const query = await this.client.query<QueryType>({
            query: QUERY,
            variables: { name },
            fetchPolicy: "no-cache"
        });

        const { data, error } = query.data.websiteBuilder.getEcommerceSettings;

        if (error) {
            throw new WebinyError(error);
        }

        return data;
    }
}
