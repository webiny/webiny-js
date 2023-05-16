import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";
import { mdbid } from "@webiny/utils";
import { ErrorResponse, Response, ListResponse } from "@webiny/handler-graphql";
import { NotAuthorizedError } from "@webiny/api-security";
import { SecurityContext } from "@webiny/api-security/types";
import { TenancyContext } from "@webiny/api-tenancy/types";

type Context = TenancyContext & SecurityContext;

const checkPermissions = (context: SecurityContext) => {
    const identity = context.security.getIdentity();
    if (!identity) {
        throw new NotAuthorizedError();
    }
};

export default new GraphQLSchemaPlugin<Context>({
    typeDefs: /* GraphQL */ `
        type TenancyListResponse {
            data: [Tenant]
            error: TenancyError
        }

        input GetTenantWhereInput {
            id: ID!
        }

        input TenantDomainInput {
            fqdn: String!
        }

        input TenantSettingsInput {
            domains: [TenantDomainInput!]!
        }

        input CreateTenantInput {
            name: String!
            description: String!
            tags: [String!]!
            settings: TenantSettingsInput!
        }

        input UpdateTenantInput {
            name: String!
            description: String!
            tags: [String!]!
            settings: TenantSettingsInput!
        }

        extend type TenancyQuery {
            listTenants: TenancyListResponse
            getTenant(where: GetTenantWhereInput): TenantResponse
        }

        extend type TenancyMutation {
            createTenant(data: CreateTenantInput): TenantResponse
            updateTenant(id: ID!, data: UpdateTenantInput): TenantResponse
            deleteTenant(id: ID!): TenancyBooleanResponse
        }
    `,
    resolvers: {
        TenancyQuery: {
            getTenant: async (_, { where }, context) => {
                try {
                    await checkPermissions(context);
                    const tenant = await context.tenancy.getTenantById(where.id);
                    const currentTenant = context.tenancy.getCurrentTenant();
                    const selfOrParent = [tenant.id, tenant.parent];

                    // Make sure the requested tenant is either the current tenant itself, or one of its children.
                    if (selfOrParent.includes(currentTenant.id)) {
                        return new Response(tenant);
                    }

                    throw new NotAuthorizedError();
                } catch (e) {
                    return new ErrorResponse(e);
                }
            },
            listTenants: async (_, __, context) => {
                // This lists tenants that are subtenants of the current tenant.
                try {
                    await checkPermissions(context);
                    const tenant = context.tenancy.getCurrentTenant();
                    const tenants = await context.tenancy.listTenants({ parent: tenant.id });
                    return new ListResponse(tenants);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
        },
        TenancyMutation: {
            createTenant: async (_, args: any, context) => {
                /**
                 * This method creates a subtenant of the current tenant.
                 */
                try {
                    await checkPermissions(context);
                    const tenant = context.tenancy.getCurrentTenant();
                    const newTenant = await context.tenancy.createTenant({
                        ...args.data,
                        id: mdbid(),
                        parent: tenant.id
                    });

                    return new Response(newTenant);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            },
            updateTenant: async (_, args: any, context) => {
                try {
                    await checkPermissions(context);
                    const tenantToUpdate = await context.tenancy.getTenantById(args.id);
                    const currentTenant = context.tenancy.getCurrentTenant();

                    if (!tenantToUpdate) {
                        return new ErrorResponse({
                            message: `Tenant "${args.id}" was not found!`,
                            code: "TENANT_NOT_FOUND"
                        });
                    }

                    const canUpdate = [
                        // You can update a tenant if it's a child of the current tenant.
                        currentTenant.id === tenantToUpdate.parent,
                        // Root tenant can update itself
                        currentTenant.id === "root" && tenantToUpdate.id === "root"
                    ];

                    // If not a single `true` is present in the array...
                    if (!canUpdate.some(Boolean)) {
                        throw new NotAuthorizedError();
                    }

                    const updatedTenant = await context.tenancy.updateTenant(args.id, args.data);

                    return new Response(updatedTenant);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            },
            deleteTenant: async (_, args: any, context) => {
                try {
                    await checkPermissions(context);
                    const tenantToDelete = await context.tenancy.getTenantById(args.id);
                    if (!tenantToDelete) {
                        return new ErrorResponse({
                            message: `Tenant "${args.id}" was not found!`,
                            code: "TENANT_NOT_FOUND"
                        });
                    }

                    // You can only delete a tenant if it's a child of the current tenant.
                    const currentTenant = context.tenancy.getCurrentTenant();
                    if (currentTenant.id !== tenantToDelete.parent) {
                        throw new NotAuthorizedError();
                    }

                    await context.tenancy.deleteTenant(args.id);

                    return new Response(true);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
        }
    }
});
