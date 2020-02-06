import { NotFoundResponse } from "./responses";

export default (id?: string) => {
    return new NotFoundResponse(id ? `Entry "${id}" not found!` : "Entry not found!");
};
