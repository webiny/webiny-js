// @flow
import { Attribute } from "webiny-model";

class BufferAttribute extends Attribute {
    encoding: buffer$NonBufferEncoding;

    constructor(name: string, encoding: buffer$NonBufferEncoding) {
        super(name);
        this.encoding = encoding;
    }

    async validateType(value: mixed) {
        if (value instanceof Buffer) {
            return;
        }

        if (typeof value === "string" && value.startsWith("data:")) {
            return;
        }

        this.expected("Buffer or data URI string", typeof value);
    }

    // $FlowIgnore
    async setValue(value) {
        if (typeof value === "string") {
            value = Buffer.from(value.split(",").pop(), this.encoding);
        }
        return Attribute.prototype.setValue.call(this, value);
    }
}

export default BufferAttribute;
