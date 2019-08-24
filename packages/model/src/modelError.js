// @flow
class ModelError extends Error {
    static INVALID_ATTRIBUTE: string;
    static INVALID_ATTRIBUTES: string;
    static ATTRIBUTE_NOT_FOUND: string;
    static POPULATE_FAILED_NOT_OBJECT: string;

    message: string;
    code: ?string;
    data: mixed;

    constructor(message: string = "", code: ?string = "", data: mixed = null) {
        super();
        this.message = message;
        this.code = code;
        this.data = data;
    }
}

ModelError.INVALID_ATTRIBUTE = "INVALID_ATTRIBUTE";
ModelError.INVALID_ATTRIBUTES = "INVALID_ATTRIBUTES";
ModelError.ATTRIBUTE_NOT_FOUND = "ATTRIBUTE_NOT_FOUND";
ModelError.POPULATE_FAILED_NOT_OBJECT = "POPULATE_FAILED_NOT_OBJECT";

export default ModelError;
