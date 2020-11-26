import { Response } from "@webiny/handler-graphql/responses";
import { GraphQLFieldResolver } from "@webiny/handler-graphql/types";
import getPreSignedPostPayload from "./utils/getPresignedPostPayload";
import { FileManagerResolverContext } from "@webiny/api-file-manager/types";

const resolver: GraphQLFieldResolver = async (root, args, context: FileManagerResolverContext) => {
    const { data } = args;
    const settings = await context.fileManager.fileManagerSettings.getSettings();
    return new Response(await getPreSignedPostPayload(data, settings));
};

export default resolver;
