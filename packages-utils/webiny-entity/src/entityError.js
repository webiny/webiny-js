// @flow
class EntityError extends Error {
    static ATTRIBUTE_NOT_FOUND: string;
    static CANNOT_DELETE_NO_ID: string;
    static MODEL_MISSING: string;

    message: string;
    data: ?Object;
    type: ?string;

    constructor(message: string, type: ?string, data: ?Object) {
        super();
        this.message = message;
        this.data = data;
        this.type = type;
    }
}

EntityError.ATTRIBUTE_NOT_FOUND = "attributeNotFound";
EntityError.CANNOT_DELETE_NO_ID = "cannotDeleteNoId";
EntityError.MODEL_MISSING = "modelMissing";

export default EntityError;
