class EntityError {
    constructor(message, type = null, data = null) {
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

EntityError.ATTRIBUTE_NOT_FOUND = 'attributeNotFound';

module.exports = EntityError;