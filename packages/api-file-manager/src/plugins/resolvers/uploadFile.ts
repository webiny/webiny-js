import { Response } from "@webiny/graphql/responses";
import { GraphQLFieldResolver } from "@webiny/graphql/types";
import getPreSignedPostPayload from "./utils/getPresignedPostPayload";
import { SETTINGS_KEY } from "@webiny/api-file-manager/plugins/crud/filesSettings.crud";

const resolver: GraphQLFieldResolver = async (root, args, context) => {
    const { data } = args;
    const settings = await context.filesSettings.get(SETTINGS_KEY);
    return new Response(await getPreSignedPostPayload(data, settings));
};

export default resolver;
