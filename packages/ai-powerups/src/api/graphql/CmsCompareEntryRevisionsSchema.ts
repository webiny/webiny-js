import { CoreGraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.core.js";
import { CmsCompareEntryRevisionsUseCase } from "~/api/features/CmsCompareEntryRevisions/abstractions.js";

class CmsCompareEntryRevisionsSchemaImpl implements CoreGraphQLSchemaFactory.Interface {
    async execute(
        builder: CoreGraphQLSchemaFactory.SchemaBuilder
    ): Promise<CoreGraphQLSchemaFactory.SchemaBuilder> {
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

            extend type CmsQuery {
                compareEntryRevisions(
                    modelId: String!
                    revisionId1: String!
                    revisionId2: String!
                ): CompareRevisionsResponse!
            }
        `);

        builder.addResolver({
            path: "CmsQuery.compareEntryRevisions",
            dependencies: [CmsCompareEntryRevisionsUseCase],
            resolver: (useCase: CmsCompareEntryRevisionsUseCase.Interface) => {
                return async ({
                    args
                }: {
                    args: {
                        modelId: string;
                        revisionId1: string;
                        revisionId2: string;
                    };
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

export const CmsCompareEntryRevisionsSchema = CoreGraphQLSchemaFactory.createImplementation({
    implementation: CmsCompareEntryRevisionsSchemaImpl,
    dependencies: []
});
