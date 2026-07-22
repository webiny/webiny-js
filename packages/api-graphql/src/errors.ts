import WebinyError from "@webiny/error";

export class NotFoundError extends WebinyError {
    constructor(message = "Not found.") {
        super(message, "NOT_FOUND");
    }
}
