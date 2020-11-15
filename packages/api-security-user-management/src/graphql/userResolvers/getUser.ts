import { ErrorResponse, NotFoundResponse, Response } from "@webiny/graphql/responses";

export default async (_, args, context) => {
    const { id, login } = args;
    const { users } = context;

    try {
        let user;
        if (id) {
            user = await users.get(id);
        }
        if (login) {
            user = await users.getByLogin(login);
        }
        if (!user) {
            return new NotFoundResponse("User not found!");
        }
        return new Response(user);
    } catch (e) {
        return new ErrorResponse({
            code: e.code,
            message: e.message,
            data: e.data || null
        });
    }
};
