import tenantLinkAuthorization from "~/plugins/tenantLinkAuthorization";
import { createHandler } from "@webiny/handler-aws";
import graphqlHandlerPlugins from "@webiny/handler-graphql";
import { PluginCollection } from "@webiny/plugins/types";
import { authenticateUsingHttpHeader } from "~/plugins/authenticateUsingHttpHeader";
import { createSecurityContext, createSecurityGraphQL } from "~/index";

// Graphql
import {
    CREATE_SECURITY_GROUP,
    DELETE_SECURITY_GROUP,
    GET_SECURITY_GROUP,
    LIST_SECURITY_GROUPS,
    UPDATE_SECURITY_GROUP
} from "./graphql/groups";

import {
    CREATE_SECURITY_TEAM,
    DELETE_SECURITY_TEAM,
    GET_SECURITY_TEAM,
    LIST_SECURITY_TEAMS,
    UPDATE_SECURITY_TEAM
} from "./graphql/teams";

import {
    CREATE_API_KEY,
    DELETE_API_KEY,
    GET_API_KEY,
    LIST_API_KEYS,
    UPDATE_API_KEY
} from "./graphql/apiKeys";

import { INSTALL, INSTALL_TENANCY, IS_INSTALLED } from "./graphql/install";
import { LOGIN } from "./graphql/login";
import { customGroupAuthorizer } from "./mocks/customGroupAuthorizer";
import { customAuthenticator } from "./mocks/customAuthenticator";
import { triggerAuthentication } from "./mocks/triggerAuthentication";
import { createTenancyContext, createTenancyGraphQL } from "@webiny/api-tenancy";
import { TenancyStorageOperations } from "@webiny/api-tenancy/types";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import { SecurityStorageOperations } from "~/types";
import { APIGatewayEvent, LambdaContext } from "@webiny/handler-aws/types";
import { DecryptedWcpProjectLicense } from "@webiny/wcp/types";
import { createWcpContext } from "@webiny/api-wcp";

type UseGqlHandlerParams = {
    plugins?: PluginCollection;
    wcpLicense?: DecryptedWcpProjectLicense;
};

export default (opts: UseGqlHandlerParams = {}) => {
    const defaults = { plugins: [] };
    opts = Object.assign({}, defaults, opts);

    const tenancyStorage = getStorageOps<TenancyStorageOperations>("tenancy");
    const securityStorage = getStorageOps<SecurityStorageOperations>("security");

    // Creates the actual handler. Feel free to add additional plugins if needed.
    const handler = createHandler({
        plugins: [
            graphqlHandlerPlugins(),
            createWcpContext({ testProjectLicense: opts.wcpLicense }),
            createTenancyContext({
                storageOperations: tenancyStorage.storageOperations
            }),
            createTenancyGraphQL(),
            createSecurityContext({ storageOperations: securityStorage.storageOperations }),
            createSecurityGraphQL(),
            authenticateUsingHttpHeader(),
            triggerAuthentication(),
            customAuthenticator(),
            customGroupAuthorizer(),
            tenantLinkAuthorization({ identityType: "admin" }),
            opts.plugins
        ].filter(Boolean) as PluginCollection
    });

    // Let's also create the "invoke" function. This will make handler invocations in actual tests easier and nicer.
    const invoke = async ({ httpMethod = "POST", body = {}, headers = {}, ...rest }) => {
        const response = await handler(
            {
                path: "/graphql",
                httpMethod,
                headers: {
                    ["x-tenant"]: "root",
                    ["Content-Type"]: "application/json",
                    ...headers
                },
                body: JSON.stringify(body),
                ...rest
            } as unknown as APIGatewayEvent,
            {} as LambdaContext
        );

        // The first element is the response body, and the second is the raw response.
        return [JSON.parse(response.body), response];
    };

    const securityGroup = {
        async create(variables = {}) {
            return invoke({ body: { query: CREATE_SECURITY_GROUP, variables } });
        },
        async update(variables = {}) {
            return invoke({ body: { query: UPDATE_SECURITY_GROUP, variables } });
        },
        async delete(variables = {}) {
            return invoke({ body: { query: DELETE_SECURITY_GROUP, variables } });
        },
        async list(variables = {}, headers = {}) {
            return invoke({ body: { query: LIST_SECURITY_GROUPS, variables }, headers });
        },
        async get(variables = {}) {
            return invoke({ body: { query: GET_SECURITY_GROUP, variables } });
        }
    };
    const securityTeam = {
        async create(variables = {}) {
            return invoke({ body: { query: CREATE_SECURITY_TEAM, variables } });
        },
        async update(variables = {}) {
            return invoke({ body: { query: UPDATE_SECURITY_TEAM, variables } });
        },
        async delete(variables = {}) {
            return invoke({ body: { query: DELETE_SECURITY_TEAM, variables } });
        },
        async list(variables = {}, headers = {}) {
            return invoke({ body: { query: LIST_SECURITY_TEAMS, variables }, headers });
        },
        async get(variables = {}) {
            return invoke({ body: { query: GET_SECURITY_TEAM, variables } });
        }
    };

    const securityApiKeys = {
        async list(variables = {}) {
            return invoke({ body: { query: LIST_API_KEYS, variables } });
        },
        async get(variables = {}) {
            return invoke({ body: { query: GET_API_KEY, variables } });
        },
        async create(variables = {}) {
            return invoke({ body: { query: CREATE_API_KEY, variables } });
        },
        async update(variables = {}) {
            return invoke({ body: { query: UPDATE_API_KEY, variables } });
        },
        async delete(variables = {}) {
            return invoke({ body: { query: DELETE_API_KEY, variables } });
        }
    };

    const install = {
        async isInstalled() {
            return invoke({ body: { query: IS_INSTALLED } });
        },
        async install(headers = {}) {
            await this.installTenancy();
            return invoke({ body: { query: INSTALL }, headers });
        },
        async installTenancy() {
            return await invoke({ body: { query: INSTALL_TENANCY } });
        }
    };

    const securityIdentity = {
        async login() {
            return invoke({ body: { query: LOGIN } });
        }
    };

    return {
        handler,
        invoke,
        securityIdentity,
        securityGroup,
        securityTeam,
        securityApiKeys,
        install
    };
};
