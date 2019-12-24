import { Response } from "@webiny/api";
import getPreSignedPostPayload from "./utils/getPresignedPostPayload";

export default async (root: any, args: Record<string, any>) => {
    const { data } = args;
    return new Response(await getPreSignedPostPayload(data));
};
