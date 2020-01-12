import { Response, NotFoundResponse } from "@webiny/commodo-graphql";

export default async (root: any, args: { [key: string]: any }, context: { [key: string]: any }) => {
    const { user } = context;

    if (user) {
        const { SecurityUser } = context.models;
        const instance = await SecurityUser.findById(user.id);
        if (!instance) {
            return new NotFoundResponse(`User with ID ${user.id} was not found!`);
        }

        return new Response(instance);
    }

    return new Response(null);
};
