import { GraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.js";
import { Response } from "@webiny/handler-graphql";
import { ErrorResponse } from "@webiny/handler-graphql";
import { renderInputFields } from "@webiny/api-headless-cms/utils/renderInputFields.js";
import { CreateTenantUseCase } from "../features/CreateTenant/abstractions.js";
import { ListModelsUseCase } from "@webiny/api-headless-cms/exports/api/cms/model.js";
import { TENANT_MODEL_ID } from "~/shared/constants.js";
import { CmsModelFieldToGraphQLRegistry } from "@webiny/api-headless-cms/exports/api/cms/graphql.js";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";

class CreateTenantSchema implements GraphQLSchemaFactory.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private listModelsUseCase: ListModelsUseCase.Interface,
        private readonly fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface
    ) {}

    async execute(
        builder: GraphQLSchemaFactory.SchemaBuilder
    ): Promise<GraphQLSchemaFactory.SchemaBuilder> {
        const inputCreateFields = await this.getExtensionsInput();

        builder.addTypeDefs(/* GraphQL */ `
            ${inputCreateFields.map(f => f.typeDefs).join("\n")}

            input CreateTenantInput {
                id: ID
                name: String!
                description: String
                ${inputCreateFields.map(f => f.fields).join("\n")}
            }
        `);

        builder.addTypeDefs(/* GraphQL */ `
            extend type TenantManagerMutation {
                createTenant(input: CreateTenantInput!): BooleanResponse
            }
        `);

        builder.addResolver<{ input: CreateTenantUseCase.Input }>({
            path: "TenantManagerMutation.createTenant",
            dependencies: [CreateTenantUseCase],
            resolver: (createTenant: CreateTenantUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await createTenant.execute(args.input);

                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }

                    return new Response(true);
                };
            }
        });

        return builder;
    }

    private async getExtensionsInput() {
        const modelsResult = await this.identityContext.withoutAuthorization(() => {
            return this.listModelsUseCase.execute({
                includePlugins: true,
                includePrivate: false
            });
        });

        if (modelsResult.isFail()) {
            return [
                {
                    typeDefs: "",
                    fields: "extensions: JSON"
                }
            ];
        }

        const models = modelsResult.value;
        const model = models.find(m => m.modelId === TENANT_MODEL_ID);

        if (!model) {
            return [{ typeDefs: "", fields: "extensions: JSON" }];
        }

        const inputCreateFields = renderInputFields({
            models,
            model,
            fields: model.fields.filter(f => f.fieldId === "extensions"),
            fieldRegistry: this.fieldRegistry
        });

        return inputCreateFields;
    }
}

export default GraphQLSchemaFactory.createImplementation({
    implementation: CreateTenantSchema,
    dependencies: [IdentityContext, ListModelsUseCase, CmsModelFieldToGraphQLRegistry]
});
