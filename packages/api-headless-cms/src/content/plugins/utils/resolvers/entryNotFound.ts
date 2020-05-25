import { NotFoundResponse } from "@webiny/graphql";

export const entryNotFound = (id: string = null) => {
    return new NotFoundResponse(id ? `Entry "${id}" not found!` : "Entry not found!");
};
