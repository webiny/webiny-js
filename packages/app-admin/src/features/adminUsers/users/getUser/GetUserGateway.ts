import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import {
    GetUserGateway as GatewayAbstraction,
    type IGetUserGatewayParams,
    type IGetUserGatewayResult
} from "./abstractions/index.js";

const GET_USER = /* GraphQL */ `
    query GetUser($id: ID!) {
        adminUsers {
            user: getUser(where: { id: $id }) {
                data {
                    id
                    email
                    firstName
                    lastName
                    avatar
                    external
                    roles {
                        id
                        slug
                        name
                    }
                    teams {
                        id
                        slug
                        name
                    }
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

type GetUserResponse = {
    adminUsers: {
        user:
            | { data: IGetUserGatewayResult; error: null }
            | { data: null; error: { code: string; message: string } };
    };
};

class GetUserGraphQLGateway implements GatewayAbstraction.Interface {
    constructor(private readonly client: MainGraphQLClient.Interface) {}

    async execute(params: IGetUserGatewayParams): Promise<IGetUserGatewayResult> {
        const response = await this.client.execute<GetUserResponse>({
            query: GET_USER,
            variables: { id: params.id }
        });

        const envelope = response.adminUsers.user;
        if (envelope.error) {
            throw new Error(envelope.error.message);
        }

        return envelope.data;
    }
}

export const GetUserGateway = GatewayAbstraction.createImplementation({
    implementation: GetUserGraphQLGateway,
    dependencies: [MainGraphQLClient]
});
