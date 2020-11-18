import { NotFoundResponse } from "@webiny/handler-graphql/responses";

export const entryNotFound = (id: string = null) => {
    return new NotFoundResponse(id ? `Entry "${id}" not found!` : "Entry not found!");
};
