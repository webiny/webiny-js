class ModelError {
    constructor(message, type = '', data = {}) {
        this.message = message;
        this.data = data;
        this.type = type;
    }

    setMessage(message) {
        this.message = message;
        return this;
    }

    getMessage() {
        return this.message;
    }

    setData(data) {
        this.data = data;
        return this;
    }

    getData() {
        return this.data;
    }

    setType(type) {
        this.type = type;
        return this;
    }

    getType() {
        return this.type;
    }
}

ModelError.INVALID_ATTRIBUTE = 'invalidAttribute';
ModelError.INVALID_ATTRIBUTES = 'invalidAttributes';
ModelError.ATTRIBUTE_NOT_FOUND = 'attributeNotFound';
ModelError.POPULATE_FAILED_NOT_OBJECT = 'populateFailedNotObject';

module.exports = ModelError;