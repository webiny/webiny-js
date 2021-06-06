import { ErrorResponse, Response } from "@webiny/handler-graphql/responses";
import { Group, SecurityIdentityProviderPlugin, AdminUsersContext } from "../types";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin";

const createDefaultGroups = async (
    context: AdminUsersContext
): Promise<Record<"fullAccessGroup" | "anonymousGroup", Group>> => {
    const tenant = context.tenancy.getCurrentTenant();

    let anonymousGroup: Group = null;
    let fullAccessGroup: Group = null;

    const groups = await context.security.groups.listGroups(tenant);

    groups.forEach(group => {
        if (group.slug === "full-access") {
            fullAccessGroup = group;
        }

        if (group.slug === "anonymous") {
            anonymousGroup = group;
        }
    });

    if (!fullAccessGroup) {
        fullAccessGroup = await context.security.groups.createGroup(tenant, {
            name: "Full Access",
            description: "Grants full access to all apps.",
            system: true,
            slug: "full-access",
            permissions: [{ name: "*" }]
        });
    }

    if (!anonymousGroup) {
        anonymousGroup = await context.security.groups.createGroup(tenant, {
            name: "Anonymous",
            description: "Permissions for anonymous users (public access).",
            system: true,
            slug: "anonymous",
            permissions: []
        });
    }

    return { fullAccessGroup, anonymousGroup };
};

export default new GraphQLSchemaPlugin<AdminUsersContext>({
    typeDefs: /* GraphQL */ `
        input SecurityInstallInput {
            firstName: String!
            lastName: String!
            login: String!
        }

        extend type SecurityQuery {
            "Get installed version"
            version: String
        }

        extend type SecurityMutation {
            "Install Security"
            install(data: SecurityInstallInput!): SecurityBooleanResponse
        }
    `,
    resolvers: {
        SecurityQuery: {
            version: async (root, args, context) => {
                return await context.security.system.getVersion();
            }
        },
        SecurityMutation: {
            install: async (root, args, context) => {
                const rootTenant = await context.tenancy.getRootTenant();

                if (rootTenant) {
                    return new ErrorResponse({
                        code: "SECURITY_INSTALL_ABORTED",
                        message: "Security is already installed."
                    });
                }

                const { data } = args;

                try {
                    // Create root tenant
                    const tenant = await context.tenancy.createTenant({
                        id: "root",
                        name: "Root",
                        parent: null
                    });

                    context.tenancy.setCurrentTenant(tenant);

                    const authPlugin = context.plugins.byName<SecurityIdentityProviderPlugin>(
                        "security-identity-provider"
                    );

                    try {
                        await authPlugin.createUser({ data, permanent: true }, context);
                    } catch (e) {
                        await context.tenancy.deleteTenant("root");
                        return new ErrorResponse({
                            code: "SECURITY_INSTALL_ABORTED",
                            message: e.message
                        });
                    }

                    // Create default groups
                    const { fullAccessGroup } = await createDefaultGroups(context);

                    // Create new user
                    const user = await context.security.users.createUser(data);

                    // Link user with group for this tenant
                    await context.security.users.linkUserToTenant(
                        user.login,
                        tenant,
                        fullAccessGroup
                    );

                    // Store app version
                    await context.security.system.setVersion(context.WEBINY_VERSION);

                    return new Response(true);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
        }
    }
});
