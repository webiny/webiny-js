import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import type { CmsErrorResponse } from "~/types.js";
import type { EntryAuthor } from "./abstractions.js";
import { ListEntryAuthorsGateway as GatewayAbstraction } from "./abstractions.js";

interface ListAdminUsersResponse {
    adminUsers: {
        listUsers: {
            data: EntryAuthor[] | null;
            error: CmsErrorResponse | null;
        };
    };
}

const LIST_ADMIN_USERS = /* GraphQL */ `
    query CmsListEntryAuthors {
        adminUsers {
            listUsers {
                data {
                    id
                    displayName
                }
                error {
                    code
                    data
                    message
                }
            }
        }
    }
`;

class ListEntryAuthorsGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(): Promise<EntryAuthor[]> {
        const response = await this.client.execute<ListAdminUsersResponse>({
            query: LIST_ADMIN_USERS
        });

        const { data, error } = response.adminUsers.listUsers;

        if (!data) {
            throw new Error(error?.message || "Could not fetch users.");
        }

        return data.map(user => ({ id: user.id, displayName: user.displayName }));
    }
}

export const ListEntryAuthorsGateway = GatewayAbstraction.createImplementation({
    implementation: ListEntryAuthorsGatewayImpl,
    dependencies: [MainGraphQLClient]
});
