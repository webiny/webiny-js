import Error from "@webiny/error";

export class NotFoundError extends Error {
    constructor(message = "Not found.") {
        super(message, "NOT_FOUND");
    }
}
