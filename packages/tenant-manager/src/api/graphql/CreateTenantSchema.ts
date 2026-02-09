import { GraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.js";
import { Response } from "@webiny/handler-graphql";
import { ErrorResponse } from "@webiny/handler-graphql";
import { PluginsContainer } from "@webiny/api-headless-cms/legacy/abstractions.js";
import { renderInputFields } from "@webiny/api-headless-cms/utils/renderInputFields.js";
import { CreateTenantUseCase } from "../features/CreateTenant/abstractions.js";
import { createFieldTypePluginRecords } from "@webiny/api-headless-cms/graphql/schema/createFieldTypePluginRecords.js";
import { ListModelsUseCase } from "@webiny/api-headless-cms/exports/api/cms/model.js";
import { TENANT_MODEL_ID } from "~/shared/constants.js";

class CreateTenantSchema implements GraphQLSchemaFactory.Interface {
    constructor(
        private pluginsContainer: PluginsContainer.Interface,
        private listModelsUseCase: ListModelsUseCase.Interface
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
        const fieldTypePlugins = createFieldTypePluginRecords(this.pluginsContainer);

        const modelsResult = await this.listModelsUseCase.execute({
            includePlugins: true,
            includePrivate: false
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
        const model = models.find(m => m.modelId === TENANT_MODEL_ID)!;

        const inputCreateFields = renderInputFields({
            models,
            model,
            fields: model.fields.filter(f => f.fieldId === "extensions"),
            fieldTypePlugins
        });

        return inputCreateFields;
    }
}

export default GraphQLSchemaFactory.createImplementation({
    implementation: CreateTenantSchema,
    dependencies: [PluginsContainer, ListModelsUseCase]
});
