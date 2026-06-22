import { ErrorResponse } from "@webiny/handler-graphql";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { NotFoundResponse } from "@webiny/handler-graphql";
import { Response } from "@webiny/handler-graphql";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import { GetFileByUrlUseCase } from "~/features/file/GetFileByUrl/abstractions.js";

export const getFileByUrl = () => {
    const fileManagerGraphQL = new GraphQLSchemaPlugin<ApiCoreContext>({
        typeDefs: /* GraphQL */ `
            extend type FmQuery {
                getFileByUrl(url: String!): FmFileResponse
            }
        `,
        resolvers: {
            FmQuery: {
                async getFileByUrl(_, args, context) {
                    const { url } = args as { url: string };
                    const useCase = context.container.resolve(GetFileByUrlUseCase);
                    const result = await useCase.execute(url);

                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }

                    if (!result.value) {
                        return new NotFoundResponse("File not found!");
                    }

                    return new Response(result.value);
                }
            }
        }
    });
    fileManagerGraphQL.name = "fm.graphql.getFileByUrl";

    return fileManagerGraphQL;
};
