import type { Container } from "@webiny/di";
import type { GraphQLSchema } from "graphql";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { GraphQLContextualSchema } from "@webiny/handler-graphql";
import type { IGraphQLContextualSchema } from "@webiny/handler-graphql";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { FileModel } from "~/domain/file/abstractions.js";
import { FILE_MODEL_ID } from "~/domain/file/file.model.js";

class FileModelContextualSchemaImpl implements IGraphQLContextualSchema {
    constructor(
        private tenantCtx: TenantContext.Interface,
        private identityCtx: IdentityContext.Interface,
        private getModel: GetModelUseCase.Interface
    ) {}

    async build(ctx: Record<string, any>): Promise<GraphQLSchema> {
        const empty = makeExecutableSchema({
            typeDefs: "type Query\ntype Mutation",
            assumeValidSDL: true
        });

        if (!this.tenantCtx.getTenant()) {
            return empty;
        }

        const container = ctx.container as Container;
        await this.identityCtx.withoutAuthorization(async () => {
            const result = await this.getModel.execute(FILE_MODEL_ID);
            if (result.value) {
                container.registerInstance(FileModel, result.value);
            }
        });

        return empty;
    }
}

export const FileModelContextualSchema = GraphQLContextualSchema.createImplementation({
    implementation: FileModelContextualSchemaImpl,
    dependencies: [TenantContext, IdentityContext, GetModelUseCase]
});
