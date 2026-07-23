import { GraphQLSchemaFactory } from "webiny/api/graphql";
import { CompareRevisionsUseCase } from "../features/compareRevisions/abstractions.js";

class CompareRevisionsSchema implements GraphQLSchemaFactory.Interface {
    async execute(
        builder: GraphQLSchemaFactory.SchemaBuilder
    ): Promise<GraphQLSchemaFactory.SchemaBuilder> {
        builder.addTypeDefs(/* GraphQL */ `
            type CompareRevisionsResult {
                html: String
                summary: String
            }

            type CompareRevisionsError {
                message: String
                code: String
                data: JSON
            }

            type CompareRevisionsResponse {
                data: CompareRevisionsResult
                error: CompareRevisionsError
            }

            extend type Query {
                compareEntryRevisions(
                    modelId: String!
                    revisionId1: String!
                    revisionId2: String!
                ): CompareRevisionsResponse!
            }
        `);

        builder.addResolver({
            path: "Query.compareEntryRevisions",
            dependencies: [CompareRevisionsUseCase],
            resolver: (useCase: CompareRevisionsUseCase.Interface) => {
                return async ({
                    args
                }: {
                    args: { modelId: string; revisionId1: string; revisionId2: string };
                }) => {
                    try {
                        const result = await useCase.execute({
                            modelId: args.modelId,
                            revisionId1: args.revisionId1,
                            revisionId2: args.revisionId2
                        });
                        return { data: result, error: null };
                    } catch (e: unknown) {
                        const message = e instanceof Error ? e.message : "Unknown error";
                        return {
                            data: null,
                            error: {
                                message,
                                code: "COMPARE_REVISIONS_ERROR",
                                data: null
                            }
                        };
                    }
                };
            }
        });

        return builder;
    }
}

export default GraphQLSchemaFactory.createImplementation({
    implementation: CompareRevisionsSchema,
    dependencies: []
});
