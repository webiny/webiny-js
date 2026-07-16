import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import {
    ListUsersGateway as GatewayAbstraction,
    type IListUsersGatewayResult
} from "./abstractions/index.js";

const LIST_USERS = /* GraphQL */ `
    query ListUsers {
        adminUsers {
            users: listUsers {
                data {
                    id
                    email
                    firstName
                    lastName
                    avatar
                    createdOn
                    external
                }
            }
        }
    }
`;

type ListUsersResponse = {
    adminUsers: {
        users: {
            data: IListUsersGatewayResult[];
        };
    };
};

class ListUsersGraphQLGateway implements GatewayAbstraction.Interface {
    constructor(private readonly client: MainGraphQLClient.Interface) {}

    async execute(): Promise<IListUsersGatewayResult[]> {
        const response = await this.client.execute<ListUsersResponse>({
            query: LIST_USERS
        });

        return response.adminUsers.users.data;
    }
}

export const ListUsersGateway = GatewayAbstraction.createImplementation({
    implementation: ListUsersGraphQLGateway,
    dependencies: [MainGraphQLClient]
});
