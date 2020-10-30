import { ListResponse, ListErrorResponse } from "@webiny/graphql";

export default async (_, args, context) => {
    try {
        const { users } = context;
        const list = await users.list();

        return new ListResponse(list.map(item => item.data));
    } catch (e) {
        return new ListErrorResponse({
            code: e.code,
            message: e.message,
            data: e.data || null
        });
    }
};
