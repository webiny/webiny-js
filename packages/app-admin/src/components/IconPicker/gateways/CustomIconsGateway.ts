import { ApolloClient } from "apollo-client";

import { ListCustomIconsQueryVariables, ListCustomIconsResponse } from "./customIcons.types";
import { CustomIconsGatewayInterface } from "./CustomIconsGatewayInterface";
import { LIST_CUSTOM_ICONS } from "./customIcons.gql";

export class CustomIconsGateway implements CustomIconsGatewayInterface {
    private client: ApolloClient<any>;

    constructor(client: ApolloClient<any>) {
        this.client = client;
    }

    async listCustomIcons() {
        const { data: response } = await this.client.query<
            ListCustomIconsResponse,
            ListCustomIconsQueryVariables
        >({
            query: LIST_CUSTOM_ICONS,
            variables: {
                limit: 10000
            },
            fetchPolicy: "network-only"
        });

        if (!response) {
            throw new Error("Network error while listing custom icons.");
        }

        const { data, error } = response.fileManager.listFiles;

        if (!data) {
            throw new Error(error?.message || "Could not fetch custom icons.");
        }

        return data;
    }
}
