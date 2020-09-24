import { Response } from "@webiny/graphql";
import getPreSignedPostPayload from "./utils/getPresignedPostPayload";

export default async (root: any, args: { [key: string]: any }, context) => {
    const { data } = args;
    const settings = await context.settingsManager.getSettings("file-manager");
    return new Response(await getPreSignedPostPayload(data, settings));
};
