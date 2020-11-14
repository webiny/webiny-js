import { ErrorResponse, Response } from "@webiny/graphql";
import { HandlerContext } from "@webiny/handler/types";
import { HandlerTenancyContext, SecurityIdentityProviderPlugin } from "../types";

const ensureFullAccessGroup = async (context: HandlerTenancyContext) => {
    const tenant = context.security.getTenant();
    let groupData = await context.security.groups.getGroup(tenant, "security-full-access");

    if (!groupData) {
        groupData = await context.security.groups.createGroup(tenant, {
            name: "Security - Full Access",
            description: "Grants full access to all API fields.",
            system: true,
            slug: "security-full-access",
            permissions: [{ name: "*" }]
        });
    }
    return groupData;
};

/**
 * We consider security to be installed if a root tenant exists.
 */
const isSecurityInstalled = async (context: HandlerTenancyContext) => {
    return !!(await context.security.tenants.getRootTenant());
};

export default {
    typeDefs: `
        input SecurityInstallInput {
            firstName: String!
            lastName: String!
            login: String!
        }

        extend type SecurityQuery {
            "Is Security installed?"
            isInstalled: SecurityBooleanResponse
        }

        type SecurityInstallResponse {
            data: Boolean
            error: SecurityError
        }

        extend type SecurityMutation {
            "Install Security"
            install(data: SecurityInstallInput!): SecurityInstallResponse
        }
    `,
    resolvers: {
        SecurityQuery: {
            isInstalled: async (root, args, context) => {
                return new Response(await isSecurityInstalled(context));
            }
        },
        SecurityMutation: {
            install: async (root, args, context: HandlerContext & HandlerTenancyContext) => {
                if (await isSecurityInstalled(context)) {
                    return new ErrorResponse({
                        code: "SECURITY_INSTALL_ABORTED",
                        message: "Security is already installed."
                    });
                }

                const { data } = args;

                try {
                    // Create root tenant
                    const tenant = await context.security.tenants.createTenant({
                        name: "Root",
                        parent: null
                    });

                    context.security.setTenant(tenant);

                    // Create full-access group
                    const group = await ensureFullAccessGroup(context);

                    const authPlugin = context.plugins.byName<SecurityIdentityProviderPlugin>(
                        "security-identity-provider"
                    );

                    // Create new user
                    await authPlugin.createUser({ data, permanent: true }, context);
                    const user = await context.security.users.createUser(data);

                    // Link user with group for this tenant
                    await context.security.users.linkUserToTenant(user.login, tenant, group);

                    return new Response(true);
                } catch (e) {
                    return new ErrorResponse({
                        code: e.code,
                        message: e.message,
                        data: e.data
                    });
                }
            }
        }
    }
};
