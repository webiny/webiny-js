/**
 * Package mdbid does not have types.
 */
// @ts-ignore
import mdbid from "mdbid";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";
import { ErrorResponse, Response, ListResponse } from "@webiny/handler-graphql";
import { SecurityContext } from "@webiny/api-security/types";
import { TenancyContext } from "@webiny/api-tenancy/types";

type Context = TenancyContext & SecurityContext;

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
            settings: TenantSettingsInput!
        }

        input UpdateTenantInput {
            name: String!
            description: String!
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
                // TODO: add permission checks
                const tenant = await context.tenancy.getTenantById(where.id);

                // Maybe move this logic into the `tenancy` app, but use storage ops for initializing the `root` tenant?
                const currentTenant = context.tenancy.getCurrentTenant();

                // Make sure current tenant is allowed to access the requested tenant.
                if (currentTenant.id !== tenant.parent && currentTenant.id !== tenant.id) {
                    return undefined;
                }

                return new Response(tenant);
            },
            listTenants: async (_, __, context) => {
                // TODO: add permission checks
                const tenant = context.tenancy.getCurrentTenant();
                const tenants = await context.tenancy.listTenants({ parent: tenant.id });
                return new ListResponse(tenants);
            }
        },
        TenancyMutation: {
            createTenant: async (_, args, context) => {
                // TODO: add permission checks
                const tenant = context.tenancy.getCurrentTenant();
                const newTenant = await context.tenancy.createTenant({
                    id: mdbid(),
                    name: args.data.name,
                    description: args.data.description,
                    parent: tenant.id,
                    settings: args.data.settings
                });

                return new Response(newTenant);
            },
            updateTenant: async (_, args, context) => {
                // TODO: add permission checks
                const tenantToUpdate = await context.tenancy.getTenantById(args.id);
                if (!tenantToUpdate) {
                    return new ErrorResponse({
                        message: `Tenant "${args.id}" was not found!`,
                        code: "TENANT_NOT_FOUND"
                    });
                }

                const updatedTenant = await context.tenancy.updateTenant(args.id, args.data);

                return new Response(updatedTenant);
            },
            deleteTenant: async (_, args, context) => {
                // TODO: add permission checks
                const tenantToUpdate = await context.tenancy.getTenantById(args.id);
                if (!tenantToUpdate) {
                    return new ErrorResponse({
                        message: `Tenant "${args.id}" was not found!`,
                        code: "TENANT_NOT_FOUND"
                    });
                }

                await context.tenancy.deleteTenant(args.id);

                return new Response(true);
            }
        }
    }
});
