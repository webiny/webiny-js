import { GraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import { staticSchemaKey } from "@webiny/api-graphql/graphql/staticSchemaKey.js";
import { ErrorResponse, Response } from "@webiny/api-graphql/responses.js";
import { ListWorkflowAiModelsUseCase } from "~/api/features/WorkflowReview/ListWorkflowAiModels/index.js";

/**
 * `WorkflowsQuery.listAiModels` (R176): the models a workflow author can pick on an AI step. It
 * extends `WorkflowsQuery` and uses `WorkflowsError`, both added by `WorkflowsSchemaFactory`, so
 * `Extension.ts` registers it only when `advancedPublishingWorkflow` is on too (R177); otherwise
 * the field does not exist and the editor treats an absent field as "no models".
 */
class ListWorkflowAiModelsSchemaImpl implements GraphQLSchemaFactory.Interface {
    public getSchemaKey = staticSchemaKey("ai-powerups/ListWorkflowAiModelsSchemaImpl");

    async execute(builder: GraphQLSchemaFactory.SchemaBuilder): GraphQLSchemaFactory.Return {
        builder.addTypeDefs(/* GraphQL */ `
            type WorkflowsAiModel {
                "The full id a step stores: <providerId>/<modelId>."
                id: String!
                name: String!
                providerId: String!
                providerName: String!
            }

            type WorkflowsAiModelListResponse {
                data: [WorkflowsAiModel!]
                error: WorkflowsError
            }

            extend type WorkflowsQuery {
                listAiModels: WorkflowsAiModelListResponse!
            }
        `);

        builder.addResolver({
            path: "WorkflowsQuery.listAiModels",
            dependencies: [ListWorkflowAiModelsUseCase],
            resolver: (listAiModels: ListWorkflowAiModelsUseCase.Interface) => {
                return async () => {
                    const result = await listAiModels.execute();
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        return builder;
    }
}

export const ListWorkflowAiModelsSchema = GraphQLSchemaFactory.createImplementation({
    implementation: ListWorkflowAiModelsSchemaImpl,
    dependencies: []
});
