import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import {
    CreateUserGateway as GatewayAbstraction,
    type ICreateUserGatewayParams,
    type ICreateUserGatewayResult
} from "./abstractions/index.js";

const CREATE_USER = /* GraphQL */ `
    mutation CreateUser($data: AdminUsersCreateInput!) {
        adminUsers {
            user: createUser(data: $data) {
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
                existingAccount
            }
        }
    }
`;

type CreateUserResponse = {
    adminUsers: {
        user:
            | {
                  data: Omit<ICreateUserGatewayResult, "existingAccount">;
                  error: null;
                  existingAccount: boolean | null;
              }
            | { data: null; error: { code: string; message: string; data: unknown } };
    };
};

class CreateUserGraphQLGateway implements GatewayAbstraction.Interface {
    constructor(private readonly client: MainGraphQLClient.Interface) {}

    async execute(params: ICreateUserGatewayParams): Promise<ICreateUserGatewayResult> {
        const response = await this.client.execute<CreateUserResponse>({
            query: CREATE_USER,
            variables: { data: params.data }
        });

        const envelope = response.adminUsers.user;
        if (envelope.error) {
            throw new Error(envelope.error.message);
        }

        return { ...envelope.data, existingAccount: envelope.existingAccount === true };
    }
}

export const CreateUserGateway = GatewayAbstraction.createImplementation({
    implementation: CreateUserGraphQLGateway,
    dependencies: [MainGraphQLClient]
});
