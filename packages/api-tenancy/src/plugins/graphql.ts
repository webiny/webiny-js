import gql from "graphql-tag";
import { GraphQLSchemaPlugin } from "@webiny/graphql/types";
import { NotFoundResponse, Response } from "@webiny/graphql";
import { hasPermission } from "@webiny/api-security";
import { HandlerTenancyContext } from "@webiny/api-tenancy/types";

const emptyResolver = () => ({});

const plugin: GraphQLSchemaPlugin = {
    type: "graphql-schema",
    name: "graphql-schema-tenancy",
    schema: {
        typeDefs: gql`
            type TenantResponse {
                data: Tenant
                error: TenantError
            }

            type TenantError {
                code: String
                message: String
                data: JSON
            }

            type TenantBooleanResponse {
                data: Boolean
                error: TenantError
            }

            type TenantDeleteResponse {
                data: Boolean
                error: TenantError
            }

            type TenantsListResponse {
                data: [Tenant]
                error: TenantError
            }

            type Tenant {
                id: ID
                name: String
                parent: ID
            }

            input TenantInput {
                id: String
                name: String!
                parent: ID
            }

            type TenantsQuery {
                getTenant(id: ID!): TenantResponse
                listTenants: TenantsListResponse
            }

            type TenantsMutation {
                createTenant(data: TenantInput!): TenantResponse
                updateTenant: TenantResponse
                deleteTenant: TenantDeleteResponse
            }

            extend type Query {
                tenants: TenantsQuery
            }

            extend type Mutation {
                tenants: TenantsMutation
            }
        `,
        resolvers: {
            Query: {
                tenants: emptyResolver
            },
            Mutation: {
                tenants: emptyResolver
            },
            TenantsQuery: {
                getTenant: hasPermission<any, any, HandlerTenancyContext>("tenancy.tenants.read")(
                    async (_, args, context) => {
                        const tenant = await context.tenancy.crud.getById(args.id);
                        if (!tenant) {
                            return new NotFoundResponse(`Tenant "${args.id}" was not found!`);
                        }

                        return new Response(tenant);
                    }
                ),
                listTenants: hasPermission<any, any, HandlerTenancyContext>("tenancy.tenants.read")(
                    async (_, args, context) => {
                        const tenants = await context.tenancy.crud.list({
                            parent: context.tenancy.getTenant().id
                        });

                        return new Response(tenants);
                    }
                )
            },
            TenantsMutation: {
                createTenant: hasPermission<any, any, HandlerTenancyContext>(
                    "tenancy.tenants.manage"
                )(async (_, args, context) => {
                    const { tenancy } = context;
                    const currentTenant = context.tenancy.getTenant()?.id;

                    const tenant = await tenancy.crud.create({
                        ...args.data,
                        parent: currentTenant
                    });

                    return new Response(tenant);
                }),
                updateTenant(_, args, context) {},
                deleteTenant(_, args, context) {}
            }
        }
    }
};

export default plugin;
