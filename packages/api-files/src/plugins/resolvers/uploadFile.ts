import { Response } from "@webiny/graphql";
import getPreSignedPostPayload from "./utils/getPresignedPostPayload";

export default async (root: any, args: { [key: string]: any }) => {
    const { data } = args;
    return new Response(await getPreSignedPostPayload(data));
};
