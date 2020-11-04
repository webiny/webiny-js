import { Response } from "@webiny/graphql";

export const install = async () => {
    // TODO: call the separate installation function via handlerClient.
    return new Response(true);
};

export const isInstalled = async () => {
    // TODO: do the necessary check here.
    return new Response(true);
};
