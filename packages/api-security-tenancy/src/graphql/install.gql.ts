import { ErrorResponse, Response } from "@webiny/handler-graphql/responses";
import { Context as HandlerContext } from "@webiny/handler/types";
import { Group, TenancyContext, SecurityIdentityProviderPlugin } from "../types";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import { SecurityContext } from "@webiny/api-security/types";

type Context = HandlerContext<TenancyContext, SecurityContext>;

const createDefaultGroups = async (
    context: TenancyContext
): Promise<Record<"fullAccessGroup" | "anonymousGroup", Group>> => {
    const tenant = context.security.getTenant();

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

const plugin: GraphQLSchemaPlugin = {
    type: "graphql-schema",
    name: "graphql-schema-security-install",
    schema: {
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
                version: async (root, args, context: Context) => {
                    return await context.security.system.getVersion();
                }
            },
            SecurityMutation: {
                install: async (root, args, context: Context) => {
                    const rootTenant = await context.security.tenants.getRootTenant();

                    if (rootTenant) {
                        return new ErrorResponse({
                            code: "SECURITY_INSTALL_ABORTED",
                            message: "Security is already installed."
                        });
                    }

                    const { data } = args;

                    try {
                        // Create root tenant
                        const tenant = await context.security.tenants.createTenant({
                            id: "root",
                            name: "Root",
                            parent: null
                        });

                        context.security.setTenant(tenant);

                        const authPlugin = context.plugins.byName<SecurityIdentityProviderPlugin>(
                            "security-identity-provider"
                        );

                        try {
                            await authPlugin.createUser({ data, permanent: true }, context);
                        } catch (e) {
                            await context.security.tenants.deleteTenant("root");
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
    }
};

export default plugin;
