// @flow
export default class SdkError extends Error {
    code: string;
    message: string;
    data: ?Object;

    constructor(params: Object) {
        super();
        const { code, message, data } = params;
        this.code = code;
        this.message = message;
        this.data = data;
    }
}
