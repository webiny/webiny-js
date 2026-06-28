import type { IGraphQLSchemaBuilder } from "@webiny/handler-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import { addSecurityBaseSchema } from "./addSecurityBaseSchema.js";
import { addApiKeySchema } from "./addApiKeySchema.js";
import { addRoleSchema } from "./addRoleSchema.js";
import { addTeamSchema } from "./addTeamSchema.js";
import { addIdentitySchema } from "./addIdentitySchema.js";

export const addSecuritySchema = (builder: IGraphQLSchemaBuilder): void => {
    addSecurityBaseSchema(builder);
    addTeamSchema(builder);
    addApiKeySchema(builder);
    addRoleSchema(builder);
    addIdentitySchema(builder);
};
