import type { Container } from "@webiny/di";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { DecryptedWcpProjectLicense } from "@webiny/wcp/types.js";
import { ListUserTeamsUseCase } from "@webiny/api-core/features/users/ListUserTeams/index.js";
import { createContextHandler } from "~tests/__handler/context.js";
import { FakeFolderLevelPermissions } from "./FakeFolderLevelPermissions.js";
import { FakeListUserTeams } from "./FakeListUserTeams.js";
import { TEST_TEAMS } from "./testContext.js";

export interface GraphQLClientParams {
    /** `undefined` → the default admin (`*`); `null` → anonymous. */
    identity?: IdentityData | null;
    /** Defaults to `*`. */
    permissions?: SecurityPermission[];
    /** Permissions of other users, for routing and candidate read checks. */
    permissionsByIdentity?: Record<string, SecurityPermission[]>;
    testProjectLicense?: DecryptedWcpProjectLicense;
    legacyPlugins?: unknown[];
}

export interface GraphQLResponseError {
    message: string;
}

export interface GraphQLResponseBody {
    data: any;
    errors?: GraphQLResponseError[];
}

export type GraphQLClient = (
    query: string,
    variables?: Record<string, unknown>
) => Promise<GraphQLResponseBody>;

/**
 * Sends `/graphql` requests as one identity, with the fixed teams and the fake FLP (A28), like
 * `createUserContext`. Data persists across handlers within one test (A32): set up through a
 * context, then call GraphQL as another user.
 */
export const createGraphQLClient = (params: GraphQLClientParams = {}): GraphQLClient => {
    const { invoke } = createContextHandler({
        identity: params.identity,
        permissions: params.permissions,
        permissionsByIdentity: params.permissionsByIdentity,
        testProjectLicense: params.testProjectLicense,
        legacyPlugins: [
            (container: Container) => {
                container.registerInstance(ListUserTeamsUseCase, new FakeListUserTeams(TEST_TEAMS));
                container.register(FakeFolderLevelPermissions);
            },
            ...(params.legacyPlugins ?? [])
        ]
    });
    return async (query, variables) => {
        const [body] = await invoke({ body: { query, variables } });
        return body as GraphQLResponseBody;
    };
};
