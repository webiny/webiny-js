import { CoreGraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import type { IGraphQLSchemaBuilder } from "@webiny/api-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import { addSecurityBaseSchema } from "./addSecurityBaseSchema.js";
import { addApiKeySchema } from "./addApiKeySchema.js";
import { addRoleSchema } from "./addRoleSchema.js";
import { addTeamSchema } from "./addTeamSchema.js";
import { addIdentitySchema } from "./addIdentitySchema.js";

/**
 * The security schema is one cohesive domain (it shares the SecurityQuery / SecurityMutation /
 * SecurityError / SecurityBooleanResponse base types), composed of five internal parts:
 * base, team, apiKey, role, identity.
 */
class SecuritySchemaFactoryImpl implements CoreGraphQLSchemaFactory.Interface {
    async execute(builder: IGraphQLSchemaBuilder): Promise<IGraphQLSchemaBuilder> {
        addSecurityBaseSchema(builder);
        addTeamSchema(builder);
        addApiKeySchema(builder);
        addRoleSchema(builder);
        addIdentitySchema(builder);

        return builder;
    }
}

export const SecuritySchemaFactory = CoreGraphQLSchemaFactory.createImplementation({
    implementation: SecuritySchemaFactoryImpl,
    dependencies: []
});
