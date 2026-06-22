import { GraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.js";
import { ErrorResponse } from "@webiny/handler-graphql";
import { NotFoundResponse } from "@webiny/handler-graphql";
import { Response } from "@webiny/handler-graphql";
import { GetFileByUrlUseCase } from "~/features/file/GetFileByUrl/abstractions.js";

class FmGetFileByUrlSchema_ implements GraphQLSchemaFactory.Interface {
    public async execute(
        builder: GraphQLSchemaFactory.SchemaBuilder
    ): Promise<GraphQLSchemaFactory.SchemaBuilder> {
        builder.addTypeDefs(/* GraphQL */ `
            extend type FmQuery {
                getFileByUrl(url: String!): FmFileResponse
            }
        `);

        builder.addResolver<{ url: string }>({
            path: "FmQuery.getFileByUrl",
            dependencies: [GetFileByUrlUseCase],
            resolver: (getFileByUrl: GetFileByUrlUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await getFileByUrl.execute(args.url);

                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }

                    if (!result.value) {
                        return new NotFoundResponse("File not found!");
                    }

                    return new Response(result.value);
                };
            }
        });

        return builder;
    }
}

export const FmGetFileByUrlSchema = GraphQLSchemaFactory.createImplementation({
    implementation: FmGetFileByUrlSchema_,
    dependencies: []
});
