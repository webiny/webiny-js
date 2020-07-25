import { Response, NotFoundResponse } from "@webiny/commodo-graphql";

export default async (root: any, args: { [key: string]: any }, context: { [key: string]: any }) => {
    const identity = context.security.getIdentity();

    if (identity) {
        const { SecurityUser } = context.models;
        const instance = await SecurityUser.findById(identity.id);
        if (!instance) {
            return new NotFoundResponse(`User with ID ${identity.id} was not found!`);
        }

        return new Response(instance);
    }

    return new Response(null);
};
