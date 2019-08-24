// @flow
class EntityError extends Error {
    static ATTRIBUTE_NOT_FOUND: string;
    static CANNOT_DELETE_NO_ID: string;
    static MODEL_MISSING: string;
    static MAX_PER_PAGE_EXCEEDED: string;

    message: string;
    data: ?Object;
    code: ?string;

    constructor(message: string, code: ?string, data: ?Object) {
        super();
        this.message = message;
        this.data = data;
        this.code = code;
    }
}

EntityError.ATTRIBUTE_NOT_FOUND = "ATTRIBUTE_NOT_FOUND";
EntityError.CANNOT_DELETE_NO_ID = "CANNOT_DELETE_NO_ID";
EntityError.MODEL_MISSING = "MODEL_MISSING";
EntityError.MAX_PER_PAGE_EXCEEDED = "MAX_PER_PAGE_EXCEEDED";

export default EntityError;
