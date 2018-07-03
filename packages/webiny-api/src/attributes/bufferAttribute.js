// @flow
import { Attribute, AttributesContainer } from "webiny-model";

class BufferAttribute extends Attribute {
    encoding: buffer$NonBufferEncoding;

    constructor(
        name: string,
        attributesContainer: AttributesContainer,
        encoding: buffer$NonBufferEncoding
    ) {
        super(name, attributesContainer);
        this.encoding = encoding;
    }

    async validateType(value: mixed) {
        if (value instanceof Buffer) {
            return;
        }

        this.expected("Buffer or data URI string", typeof value);
    }

    // $FlowFixMe
    setValue(value) {
        if (typeof value === "string") {
            value = Buffer.from(value.split(",").pop(), this.encoding);
        }
        return Attribute.prototype.setValue.call(this, value);
    }

    // $FlowFixMe
    setStorageValue(value) {
        if (typeof value === "string") {
            value = Buffer.from(value.split(",").pop(), this.encoding);
        }
        return Attribute.prototype.setStorageValue.call(this, value);
    }
}

export default BufferAttribute;
