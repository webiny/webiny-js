import { Response } from "@webiny/api";

export const myResolver = async (root, args, context) => {
    /* ... Resolver code ... */

    return new Response("Something");
};
