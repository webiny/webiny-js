import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";
import { TenancyContext } from "~/types";

export default new GraphQLSchemaPlugin<TenancyContext>({
    typeDefs: /* GraphQL */ `
        type Tenant {
            id: ID!
            name: String!
            description: String!
            parent: ID
            tags: [String!]!
            settings: TenantSettings!
        }

        type TenantDomain {
            fqdn: String!
        }

        type TenantSettings {
            domains: [TenantDomain!]!
        }
    `
});
