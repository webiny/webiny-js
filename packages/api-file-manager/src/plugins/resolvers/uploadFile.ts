import { Response } from "@webiny/graphql";
import { GraphQLFieldResolver } from "@webiny/graphql/types";
import getPreSignedPostPayload from "./utils/getPresignedPostPayload";

const resolver: GraphQLFieldResolver = async (root, args, context) => {
    const { data } = args;
    const settings = await context.settingsManager.getSettings("file-manager");
    return new Response(await getPreSignedPostPayload(data, settings));
};

export default resolver;
