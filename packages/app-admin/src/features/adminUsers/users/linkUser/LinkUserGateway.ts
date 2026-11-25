import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import { AdminUsersError } from "../shared/AdminUsersError.js";
import {
    LinkUserGateway as GatewayAbstraction,
    type ILinkUserGatewayParams,
    type ILinkUserGatewayResult
} from "./abstractions/index.js";

const LINK_USER = /* GraphQL */ `
    mutation LinkUser($data: AdminUsersLinkInput!) {
        adminUsers {
            user: linkUser(data: $data) {
                data {
                    id
                    email
                    firstName
                    lastName
                    avatar
                    createdOn
                    external
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

type LinkUserResponse = {
    adminUsers: {
        user:
            | { data: ILinkUserGatewayResult; error: null }
            | { data: null; error: { code: string; message: string; data: any } };
    };
};

class LinkUserGraphQLGateway implements GatewayAbstraction.Interface {
    constructor(private readonly client: MainGraphQLClient.Interface) {}

    async execute(params: ILinkUserGatewayParams): Promise<ILinkUserGatewayResult> {
        const response = await this.client.execute<LinkUserResponse>({
            query: LINK_USER,
            variables: { data: params.data }
        });

        const envelope = response.adminUsers.user;
        if (envelope.error) {
            throw new AdminUsersError(envelope.error);
        }

        return envelope.data;
    }
}

export const LinkUserGateway = GatewayAbstraction.createImplementation({
    implementation: LinkUserGraphQLGateway,
    dependencies: [MainGraphQLClient]
});
