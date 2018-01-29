// @flow
class ModelError extends Error {
    static INVALID_ATTRIBUTE: string;
    static INVALID_ATTRIBUTES: string;
    static ATTRIBUTE_NOT_FOUND: string;
    static POPULATE_FAILED_NOT_OBJECT: string;

    message: string;
    type: ?string;
    data: ?Object;

    constructor(message: string = "", type: ?string = "", data: ?Object = {}) {
        super();
        this.message = message;
        this.type = type;
        this.data = data;
    }
}

ModelError.INVALID_ATTRIBUTE = "invalidAttribute";
ModelError.INVALID_ATTRIBUTES = "invalidAttributes";
ModelError.ATTRIBUTE_NOT_FOUND = "attributeNotFound";
ModelError.POPULATE_FAILED_NOT_OBJECT = "populateFailedNotObject";

export default ModelError;
