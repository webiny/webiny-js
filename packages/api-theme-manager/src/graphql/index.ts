import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";
import { SecurityContext } from "@webiny/api-security/types";
import { TenancyContext } from "@webiny/api-tenancy/types";

type Context = TenancyContext & SecurityContext;

export default new GraphQLSchemaPlugin<Context>({
    typeDefs: /* GraphQL */ `
        extend input TenantSettingsInput {
            themes: [ID!]!
        }

        extend type TenantSettings {
            themes: [ID]!
        }

        extend type PbSettings {
            # leaving as optional for now, as root tenant will not have a theme
            theme: ID
        }

        extend input PbSettingsInput {
            theme: ID
        }
    `,
    resolvers: {
        TenantSettings: {
            themes(tenant) {
                return tenant.themes || [];
            }
        },
        PbSettings: {
            theme(settings, _, context) {
                const tenant = context.tenancy.getCurrentTenant();
                const themes = tenant.settings.themes || [];

                return settings.theme || themes[0];
            }
        }
    }
});
