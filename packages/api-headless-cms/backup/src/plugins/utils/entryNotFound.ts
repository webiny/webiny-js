import { NotFoundResponse } from "@webiny/api";

export const entryNotFound = (id: string = null) => {
    return new NotFoundResponse(id ? `Entry "${id}" not found!` : "Entry not found!");
};
