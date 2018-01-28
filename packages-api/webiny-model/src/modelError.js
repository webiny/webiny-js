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
        this.setMessage(message);
        this.setData(data);
        this.setType(type);
    }

    setMessage(message: string) {
        this.message = message;
    }

    getMessage(): string {
        return this.message;
    }

    setData(data: ?Object) {
        this.data = data;
    }

    getData(): ?Object {
        return this.data;
    }

    setType(type: ?string) {
        this.type = type;
    }

    getType(): ?string {
        return this.type;
    }
}

ModelError.INVALID_ATTRIBUTE = "invalidAttribute";
ModelError.INVALID_ATTRIBUTES = "invalidAttributes";
ModelError.ATTRIBUTE_NOT_FOUND = "attributeNotFound";
ModelError.POPULATE_FAILED_NOT_OBJECT = "populateFailedNotObject";

export default ModelError;
