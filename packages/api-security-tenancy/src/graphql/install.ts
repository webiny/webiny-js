import gql from "graphql-tag";
import { ErrorResponse, Response } from "@webiny/graphql";
import { HandlerContext } from "@webiny/handler/types";
import { Group, HandlerTenancyContext, SecurityIdentityProviderPlugin } from "../types";
import { GraphQLSchemaPlugin } from "@webiny/graphql/types";

const createDefaultGroups = async (
    context: HandlerTenancyContext
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
            description: "Grants full access to all API fields.",
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
    name: "graphql-schema-security",
    schema: {
        typeDefs: gql`
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
                    const rootTenant = await context.security.tenants.getRootTenant();
                    return new Response(!!rootTenant);
                }
            },
            SecurityMutation: {
                install: async (root, args, context: HandlerContext & HandlerTenancyContext) => {
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

                        // Create default groups
                        const { fullAccessGroup } = await createDefaultGroups(context);

                        const authPlugin = context.plugins.byName<SecurityIdentityProviderPlugin>(
                            "security-identity-provider"
                        );

                        // Create new user
                        await authPlugin.createUser({ data, permanent: true }, context);
                        const user = await context.security.users.createUser(data);

                        // Link user with group for this tenant
                        await context.security.users.linkUserToTenant(
                            user.login,
                            tenant,
                            fullAccessGroup
                        );

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
    }
};

export default plugin;
