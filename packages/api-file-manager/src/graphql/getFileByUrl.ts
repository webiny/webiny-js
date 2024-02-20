import { ErrorResponse, GraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { Response, NotFoundResponse } from "@webiny/handler-graphql";
import { FileManagerContext, FileManagerContextObject, File } from "~/types";
import { Security } from "@webiny/api-security/types";
import { NotAuthorizedError } from "@webiny/api-security";

export const getFileByUrl = () => {
    const fileManagerGraphQL = new GraphQLSchemaPlugin<FileManagerContext>({
        typeDefs: /* GraphQL */ `
            extend type FmQuery {
                getFileByUrl(url: String!): FmFileResponse
            }
        `,
        resolvers: {
            FmQuery: {
                async getFileByUrl(_, args, context) {
                    const { url } = args as { url: string };
                    const useCase = new SecureGetFileByUrl(
                        context.security,
                        new GetFileByUrlUseCase(context.fileManager)
                    );
                    try {
                        const file = await useCase.execute(url);
                        if (file) {
                            return new Response(file);
                        }
                        return new NotFoundResponse("File not found!");
                    } catch (error) {
                        return new ErrorResponse(error);
                    }
                }
            }
        }
    });
    fileManagerGraphQL.name = "fm.graphql.getFileByUrl";

    return fileManagerGraphQL;
};

interface IGetFileByUrl {
    execute(url: string): Promise<File | undefined>;
}

class GetFileByUrlUseCase implements IGetFileByUrl {
    private readonly fileManager: FileManagerContextObject;

    constructor(fileManager: FileManagerContextObject) {
        this.fileManager = fileManager;
    }

    async execute(url: string): Promise<File | undefined> {
        const { pathname } = new URL(url);
        const isAlias = !pathname.startsWith("/files/") && !pathname.startsWith("/private/");
        const query = isAlias ? pathname : pathname.replace("/files/", "").replace("/private/", "");

        const [files] = await this.fileManager.listFiles({
            where: {
                OR: [{ key: query }, { aliases_contains: query }]
            },
            limit: 1
        });

        return files.length ? files[0] : undefined;
    }
}

class SecureGetFileByUrl implements IGetFileByUrl {
    private security: Security;
    private useCase: IGetFileByUrl;

    constructor(security: Security, useCase: IGetFileByUrl) {
        this.security = security;
        this.useCase = useCase;
    }

    execute(url: string): Promise<File | undefined> {
        if (!this.security.getIdentity()) {
            throw new NotAuthorizedError({ message: "You're not authorized to edit this file!" });
        }

        return this.useCase.execute(url);
    }
}
