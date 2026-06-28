import type { IGraphQLSchemaBuilder } from "@webiny/handler-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import { addSecurityBaseSchema } from "./base.gql.js";
import { addApiKeySchema } from "./apiKey.gql.js";
import { addRoleSchema } from "./role.gql.js";
import { addTeamSchema } from "./team.gql.js";
import { addIdentitySchema } from "./identity.gql.js";

export const addSecuritySchema = (builder: IGraphQLSchemaBuilder): void => {
    addSecurityBaseSchema(builder);
    addTeamSchema(builder);
    addApiKeySchema(builder);
    addRoleSchema(builder);
    addIdentitySchema(builder);
};
