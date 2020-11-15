import { ListResponse, ListErrorResponse } from "@webiny/graphql/responses";

export default async (_, args, context) => {
    try {
        const { users } = context;
        const userList = await users.list();

        return new ListResponse(userList);
    } catch (e) {
        return new ListErrorResponse({
            code: e.code,
            message: e.message,
            data: e.data || null
        });
    }
};
