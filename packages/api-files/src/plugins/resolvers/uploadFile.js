// @flow
import { Response } from "@webiny/api";
import getPreSignedPostPayload from "./utils/getPreSignedPostPayload";

export default async (root: any, args: Object) => {
    const { data } = args;
    return new Response(await getPreSignedPostPayload(data));
};
